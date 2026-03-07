// ══════════════════════════════════════════════════════════
// routes/stream.rs — GET /sources/:type/:id
// RULES:
//   → Returns { "results": [Source], "cached_at": u64, "is_stale": bool }
//   → Pipeline: fetch → score → dedup → filter → multi-level sort → cap 20
//   → 3-tier scoring: language(0-600) + resolution(0-400) + source quality(0-300)
//   → Multi-level sort: cached > language > resolution > quality > seeders > size
//   → Dedup: info_hash then normalized filename (keep best score)
//   → Stale-while-revalidate: return old cache + refresh in background
//   → ?force=true: ignore cache, force new search
//   → ?year=YYYY: used for dynamic TTL based on content age
// ══════════════════════════════════════════════════════════

use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::get,
    Router,
};
use regex::Regex;
use serde_json::json;
use std::collections::HashSet;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::timeout;
use crate::AppState;
use crate::errors::AppError;
use crate::models::{ContentType, Source};
use crate::services::{cache, prowlarr, tmdb, torrentio};

const MAX_RESULTS: usize = 20;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/:type/:id", get(get_stream))
}

#[derive(serde::Deserialize)]
pub(crate) struct StreamQuery {
    /// Force new search (ignore cache)
    force: Option<bool>,
    /// Content release year — for dynamic TTL
    year:  Option<i32>,
    /// Target season (series)
    season: Option<u32>,
    /// Target episode (series)
    episode: Option<u32>,
}

pub async fn get_stream(
    Path((content_type, id)): Path<(ContentType, String)>,
    Query(params): Query<StreamQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    let force        = params.force.unwrap_or(false);
    let release_year = params.year.map(|y| y as u32);
    let season       = params.season;
    let episode      = params.episode;
    let bypass_cache_for_episode = matches!(content_type, ContentType::Series) && season.is_some() && episode.is_some();
    let use_cache = !force && !bypass_cache_for_episode;
    let cache_key    = format!(
        "{}:{}:{}_{}",
        content_type,
        id,
        season.unwrap_or(0),
        episode.unwrap_or(0)
    );

    // ── Cache check (unless force=true) ──────────────────────────
    if use_cache {
        if let Some(cache_result) = cache::get_streams_from_cache(&cache_key, &state.db).await? {
            let ttl = cache::compute_stream_ttl(release_year);
            let age = now.saturating_sub(cache_result.cached_at);

            if age < ttl {
                // Fresh cache → respond immediately
                let mut results: Vec<Source> = cache_result.streams.iter()
                    .filter_map(|s| stream_to_source(s, "cache"))
                    .collect();
                score_sources(&mut results);
                post_process_sources(&mut results);
                return Ok(Json(json!({
                    "results":   results,
                    "cached_at": cache_result.cached_at,
                    "is_stale":  false,
                })));
            }

            // Stale cache → stale-while-revalidate:
            // 1. Return old results immediately (is_stale: true)
            // 2. Launch new search in background
            let mut stale_results: Vec<Source> = cache_result.streams.iter()
                .filter_map(|s| stream_to_source(s, "cache"))
                .collect();
            score_sources(&mut stale_results);
            post_process_sources(&mut stale_results);

            let state_bg       = Arc::clone(&state);
            let id_bg          = id.clone();
            let ct_bg          = content_type.clone();
            let cache_key_bg   = cache_key.clone();
            let season_bg      = season;
            let episode_bg     = episode;
            tokio::spawn(async move {
                let _ = do_fresh_fetch(&id_bg, &ct_bg, season_bg, episode_bg, &cache_key_bg, &state_bg).await;
            });

            return Ok(Json(json!({
                "results":   stale_results,
                "cached_at": cache_result.cached_at,
                "is_stale":  true,
            })));
        }
    }

    // ── No cache (or force=true) → fresh search ─────────────────────
    let results = do_fresh_fetch(&id, &content_type, season, episode, &cache_key, &state).await?;

    if results.is_empty() {
        return Ok(Json(json!({
            "results":   [],
            "cached_at": now,
            "is_stale":  false,
        })));
    }

    Ok(Json(json!({
        "results":   results,
        "cached_at": now,
        "is_stale":  false,
    })))
}

// ── Complete search + caching ───────────────────────────────────────
// Pipeline : fetch → convert → score → dedup → filter → sort → cap 20
// Side effect: updates SQLite cache (raw data before dedup).
async fn do_fresh_fetch(
    id: &str,
    content_type: &ContentType,
    season: Option<u32>,
    episode: Option<u32>,
    cache_key: &str,
    state: &Arc<AppState>,
) -> Result<Vec<Source>, AppError> {
    // TMDB → IMDB resolution for Torrentio (which only accepts "tt...")
    let imdb_id = tmdb::resolve_to_imdb_id(id, content_type, state).await;

    // Title for Prowlarr (search by name)
    let prowlarr_query = tmdb::resolve_title_for_prowlarr(id, content_type, state).await.ok();
    let expected_title_for_match = prowlarr_query
        .as_deref()
        .map(extract_expected_title);

    let torrentio_id = imdb_id.as_deref().unwrap_or(id);

    // Torrentio: timeout 20s — Prowlarr: timeout 12s (indexer search)
    let (torrentio_result, prowlarr_result) = tokio::join!(
        async {
            timeout(
                Duration::from_secs(20),
                torrentio::fetch_torrentio_streams(torrentio_id, content_type, season, episode, state),
            )
            .await
            .unwrap_or_else(|_| Ok(vec![]))
        },
        async {
            if let Some(q) = &prowlarr_query {
                timeout(
                    Duration::from_secs(12),
                    prowlarr::fetch_prowlarr_streams(q, content_type, season, episode, state),
                )
                .await
                .unwrap_or_else(|_| Ok(vec![]))
            } else {
                Ok(vec![])
            }
        }
    );

    let torrentio_streams = torrentio_result.unwrap_or_default();
    let prowlarr_streams  = prowlarr_result.unwrap_or_default();

    // Cache BEFORE dedup/filter (all raw sources)
    let all_for_cache: Vec<crate::models::Stream> = torrentio_streams.iter()
        .chain(prowlarr_streams.iter())
        .cloned()
        .collect();

    // Convert to Source with provider tag
    let mut all_sources: Vec<Source> = Vec::new();
    for s in &torrentio_streams {
        if let Some(source) = stream_to_source(s, "torrentio") {
            all_sources.push(source);
        }
    }
    for s in &prowlarr_streams {
        if let Some(source) = stream_to_source(s, "prowlarr") {
            all_sources.push(source);
        }
    }

    // Filter series packs (keep only targeted episode)
    if matches!(content_type, ContentType::Series) {
        if let (Some(target_season), Some(target_episode)) = (season, episode) {
            let pack_regex = Regex::new(
                r"(?i)(S\d{1,2}\s*[-_]\s*S\d{1,2}|S\d{1,2}E\d{1,2}\s*[-_]\s*E\d{1,2}|COMPLETE|PACK|SAISON\s*\d{1,2})"
            )
            .expect("valid pack regex");
            let episode_regex = Regex::new(
                &format!(r"(?i)S0?{}E0?{}", target_season, target_episode)
            )
            .expect("valid episode regex");

            all_sources.retain(|source| {
                let is_pack = pack_regex.is_match(&source.title);
                let is_correct_episode = episode_regex.is_match(&source.title);
                !is_pack || is_correct_episode || source.source == "torrentio"
            });
        }
    }

    // Title relevance filter (Prowlarr only)
    if let Some(expected_title) = expected_title_for_match.as_deref() {
        all_sources.retain(|source| {
            if source.source != "prowlarr" {
                return true;
            }
            compute_title_relevance_penalty(&source.title, expected_title) < 1000
        });
    }

    // Scoring
    score_sources(&mut all_sources);

    // Title relevance penalty for Prowlarr
    if let Some(expected_title) = expected_title_for_match.as_deref() {
        for source in &mut all_sources {
            if source.source == "prowlarr" {
                let penalty = compute_title_relevance_penalty(&source.title, expected_title);
                source.score = source.score.saturating_sub(penalty);
            }
        }
    }

    // Post-processing pipeline: dedup → filter → multi-level sort → cap 20
    post_process_sources(&mut all_sources);

    if !all_for_cache.is_empty() {
        cache::cache_streams(cache_key, &all_for_cache, &state.db).await?;
    }

    Ok(all_sources)
}

// ══════════════════════════════════════════════════════════
// 3-tier scoring (inspired by AIOStreams precomputer.ts)
// ══════════════════════════════════════════════════════════

/// Resolution: 2160p(400) > 1080p(300) > 720p(200) > 480p(50) > other(0)
fn resolution_score(quality: &str) -> u32 {
    match quality.to_lowercase().as_str() {
        "2160p" | "4k" | "uhd" => 400,
        "1440p" | "2k"         => 350,
        "1080p"                => 300,
        "720p"                 => 200,
        "480p"                 => 50,
        _                      => 0,
    }
}

/// Source quality: REMUX(300) > BluRay(250) > WEB-DL(200) > WEBRip(150) > HDTV(100) > other(0)
fn quality_source_score(title: &str) -> u32 {
    let upper = title.to_uppercase();
    if upper.contains("REMUX") {
        300
    } else if upper.contains("BLURAY") || upper.contains("BLU-RAY") || upper.contains("BDREMUX") {
        250
    } else if upper.contains("WEB-DL") || upper.contains("WEBDL") {
        200
    } else if upper.contains("WEBRIP") || upper.contains("WEB-RIP") {
        150
    } else if upper.contains("HDTV") {
        100
    } else if upper.contains("DVDRIP") || upper.contains("DVD-RIP") || upper.contains("BDRIP") {
        80
    } else {
        0
    }
}

fn codec_bonus(title: &str) -> u32 {
    let upper = title.to_uppercase();
    if upper.contains("AV1") {
        90
    } else if upper.contains("HEVC") || upper.contains("X265") || upper.contains("H.265") || upper.contains("H265") {
        80
    } else if upper.contains("X264") || upper.contains("H.264") || upper.contains("H264") || upper.contains("AVC") {
        60
    } else {
        0
    }
}

fn hdr_bonus(title: &str) -> u32 {
    let upper = title.to_uppercase();
    if upper.contains("DOLBY VISION") || upper.contains("DOLBY.VISION") || upper.contains("DV HDR") {
        120
    } else if upper.contains("HDR10+") || upper.contains("HDR10PLUS") {
        100
    } else if upper.contains("HDR10") || upper.contains("HDR") {
        80
    } else {
        0
    }
}

fn cam_penalty(title: &str) -> u32 {
    let upper = title.to_uppercase();
    if upper.contains("HDCAM") || upper.contains("CAMRIP") || upper.contains(".CAM.") || upper.contains("-CAM-") {
        800
    } else if upper.contains(".TS.") || upper.contains("-TS-") || upper.contains("TELESYNC") {
        700
    } else if upper.contains(".SCR.") || upper.contains("-SCR-") || upper.contains("SCREENER") {
        600
    } else if upper.contains("HDTC") || upper.contains("HC.HD") {
        500
    } else {
        0
    }
}

/// Composite score: cache(2000) + language(0-600) + resolution(0-400) + quality(0-300)
///                 + codec(0-90) + HDR(0-120) + seeders(0-50) + size(0-50) − penalties
fn compute_score(source: &Source) -> u32 {
    let mut score: u32 = 0;

    if source.cached_rd {
        score += 2000;
    }

    score += crate::parser::language_score(&source.language, source.language_variant.as_deref());
    score += resolution_score(&source.quality);
    score += quality_source_score(&source.title);
    score += codec_bonus(&source.title);
    score += hdr_bonus(&source.title);
    score += source.seeders.min(500) / 10;

    if source.size_gb > 0.2 && source.size_gb < 60.0 {
        score += 50;
    }

    score = score.saturating_sub(cam_penalty(&source.title));

    score
}

fn score_sources(sources: &mut [Source]) {
    for source in sources.iter_mut() {
        source.score = compute_score(source);
    }
}

// ══════════════════════════════════════════════════════════
// Multi-level sort (inspired by AIOStreams sorter.ts)
// cached > language > resolution > source quality > seeders > size
// ══════════════════════════════════════════════════════════

fn multi_level_cmp(a: &Source, b: &Source) -> std::cmp::Ordering {
    // 1. Cached first
    b.cached_rd.cmp(&a.cached_rd)
        // 2. Best language score
        .then_with(|| {
            let la = crate::parser::language_score(&a.language, a.language_variant.as_deref());
            let lb = crate::parser::language_score(&b.language, b.language_variant.as_deref());
            lb.cmp(&la)
        })
        // 3. Best resolution
        .then_with(|| resolution_score(&b.quality).cmp(&resolution_score(&a.quality)))
        // 4. Best source quality
        .then_with(|| quality_source_score(&b.title).cmp(&quality_source_score(&a.title)))
        // 5. More seeders
        .then_with(|| b.seeders.cmp(&a.seeders))
        // 6. Larger file
        .then_with(|| b.size_gb.partial_cmp(&a.size_gb).unwrap_or(std::cmp::Ordering::Equal))
}

// ══════════════════════════════════════════════════════════
// Deduplication (inspired by AIOStreams deduplicator.ts DSU)
// Phase 1: exact info_hash — Phase 2: normalized filename
// Pre-sorted by score desc → retain keeps the best.
// ══════════════════════════════════════════════════════════

fn normalize_title_for_dedup(title: &str) -> String {
    let cleaned: String = title.to_lowercase().chars()
        .map(|c| if c.is_alphanumeric() { c } else { ' ' })
        .collect();

    const STOP_WORDS: &[&str] = &[
        "2160p", "1080p", "720p", "480p", "4k", "uhd", "fhd",
        "bluray", "bdrip", "brrip", "webrip", "webdl", "hdtv", "dvdrip", "dvd",
        "remux", "x264", "x265", "h264", "h265", "hevc", "avc", "av1", "xvid",
        "aac", "dts", "ac3", "flac", "atmos", "truehd", "eac3", "mp3",
        "hdr", "hdr10", "dolby", "vision", "sdr",
        "multi", "vff", "vfq", "vostfr", "french", "truefrench", "english",
        "proper", "repack", "internal", "extended", "unrated", "directors", "cut",
        "mkv", "avi", "mp4", "complete",
    ];

    cleaned.split_whitespace()
        .filter(|w| {
            w.len() > 1
                && !STOP_WORDS.contains(w)
                && !(w.len() == 4
                     && w.chars().all(|c| c.is_ascii_digit())
                     && (w.starts_with("19") || w.starts_with("20")))
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn deduplicate_sources(sources: &mut Vec<Source>) {
    // Pre-sort by multi_level_cmp: the first occurrence is the best
    sources.sort_by(multi_level_cmp);

    let mut seen_hashes: HashSet<String> = HashSet::new();
    let mut seen_titles: HashSet<String> = HashSet::new();

    sources.retain(|source| {
        // Phase 1 : dedup par info_hash
        if !source.info_hash.is_empty() {
            if !seen_hashes.insert(source.info_hash.clone()) {
                return false;
            }
        }
        // Phase 2: dedup by normalized title
        let title_key = normalize_title_for_dedup(&source.title);
        if title_key.len() >= 3 && !seen_titles.insert(title_key) {
            return false;
        }
        true
    });
}

// ══════════════════════════════════════════════════════════
// Filtering (inspired by AIOStreams filterer.ts)
// ══════════════════════════════════════════════════════════

fn filter_sources(sources: &mut Vec<Source>) {
    sources.retain(|source| {
        // Exclude seeders==0 unless already cached on RD
        if source.seeders == 0 && !source.cached_rd {
            return false;
        }
        // Exclude too small (< 200 MB ≈ 0.195 GB)
        if source.size_gb > 0.0 && source.size_gb < 0.195 {
            return false;
        }
        // Exclude too large (> 80 GB)
        if source.size_gb > 80.0 {
            return false;
        }
        true
    });
}

// ══════════════════════════════════════════════════════════
// Post-processing pipeline: dedup → filter → sort → cap
// ══════════════════════════════════════════════════════════

fn post_process_sources(sources: &mut Vec<Source>) {
    deduplicate_sources(sources);
    filter_sources(sources);
    sources.sort_by(multi_level_cmp);
    sources.truncate(MAX_RESULTS);
}

// ── Helpers de pertinence titre ───────────────────────────────────────────────

fn extract_expected_title(query: &str) -> String {
    let mut cleaned = query.trim().to_string();

    let patterns = [
        r"(?i)\s+S\d{1,2}E\d{1,2}\s*$",
        r"(?i)\s+S\d{1,2}\s*$",
        r"(?i)\s+SAISON\s+\d{1,2}\s*$",
        r"\s+\d{4}\s*$",
    ];

    for pattern in patterns {
        let regex = Regex::new(pattern).expect("valid expected-title regex");
        cleaned = regex.replace(&cleaned, "").to_string();
    }

    let cleaned = cleaned.trim();
    if cleaned.is_empty() {
        query.trim().to_string()
    } else {
        cleaned.to_string()
    }
}

fn normalize_for_title_match(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { ' ' })
        .collect::<String>()
}

fn is_stopword(token: &str) -> bool {
    matches!(
        token,
        "the" | "les" | "des" | "une" | "un" | "and" | "avec" | "pour" | "sur" | "dans" | "of"
    )
}

fn compute_title_relevance_penalty(source_title: &str, expected_title: &str) -> u32 {
    let normalized_expected = normalize_for_title_match(expected_title);
    let expected_tokens: Vec<String> = normalized_expected
        .split_whitespace()
        .filter(|token| token.len() >= 4 && !is_stopword(token))
        .map(|token| token.to_string())
        .collect();
    if expected_tokens.is_empty() {
        return 0;
    }

    let normalized_source = normalize_for_title_match(source_title);
    let matched = expected_tokens
        .iter()
        .filter(|token| normalized_source.contains(token.as_str()))
        .count();

    if matched == 0 {
        return 1200;
    }
    if expected_tokens.len() >= 2 && (matched * 2) < expected_tokens.len() {
        return 450;
    }
    0
}

// ── Internal Stream → frontend Source format conversion ───────────────────────

fn stream_to_source(stream: &crate::models::Stream, source_name: &str) -> Option<Source> {
    let info_hash = stream.info_hash.as_deref().unwrap_or("");
    let title = stream.title.as_deref().unwrap_or("Unknown source");

    // playable = can be launched via RD pipeline (requires info_hash)
    // or directly if URL is already streamable (torrentio/RD resolved)
    let playable = !info_hash.is_empty() || stream.url.as_deref().map_or(false, |u| {
        u.contains("torrentio.strem.fun") ||
        u.contains("real-debrid.com") ||
        u.contains("rdeb.io")
    });

    // Generate magnet link from info_hash, or use direct URL
    let magnet = if !info_hash.is_empty() {
        let encoded_title = title.lines().next().unwrap_or("").replace(' ', "+");
        Some(format!("magnet:?xt=urn:btih:{}&dn={}", info_hash, encoded_title))
    } else {
        stream.url.clone()
    };

    // cached_rd = true ONLY for already resolved Torrentio/RD URLs
    let cached_rd = stream.url.as_deref().map_or(false, |u| {
        u.contains("torrentio.strem.fun") ||
        u.contains("real-debrid.com") ||
        u.contains("rdeb.io")
    });

    Some(Source {
        title: title.to_string(),
        quality: stream.parsed_meta.quality.clone(),
        size_gb: stream.parsed_meta.size_gb,
        seeders: stream.parsed_meta.seeders,
        language: stream.parsed_meta.language.clone(),
        language_variant: stream.parsed_meta.language_variant.clone(),
        info_hash: info_hash.to_string(),
        magnet,
        source: source_name.to_string(),
        cached_rd,
        playable,
        rd_link: None,
        score: 0,
    })
}
