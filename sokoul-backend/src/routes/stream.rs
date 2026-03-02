// ══════════════════════════════════════════════════════════
// routes/stream.rs — GET /sources/:type/:id
// RÈGLES :
//   → Retourne { "results": [Source], "cached_at": u64, "is_stale": bool }
//   → Source = { title, quality, size_gb, seeders, language, info_hash, magnet, source, cached_rd, playable, rd_link, score }
//   → Stale-while-revalidate : retourne l'ancien cache + rafraîchit en background
//   → ?force=true : ignore le cache, force une nouvelle recherche
//   → ?year=YYYY  : utilisé pour le TTL dynamique selon l'ancienneté du contenu
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

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/:type/:id", get(stream_handler))
}

#[derive(serde::Deserialize)]
pub(crate) struct StreamQuery {
    /// Forcer une nouvelle recherche (ignore le cache)
    force: Option<bool>,
    /// Année de sortie du contenu — pour le TTL dynamique
    year:  Option<i32>,
    /// Saison ciblée (séries)
    season: Option<u32>,
    /// Épisode ciblé (séries)
    episode: Option<u32>,
}

pub async fn stream_handler(
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

    // ── Vérification du cache (sauf si force=true) ──────────────────────────
    if use_cache {
        if let Some(cache_result) = cache::get_streams_from_cache(&cache_key, &state.db).await? {
            let ttl = cache::compute_stream_ttl(release_year);
            let age = now.saturating_sub(cache_result.cached_at);

            if age < ttl {
                // Cache frais → répondre immédiatement
                let mut results: Vec<Source> = cache_result.streams.iter()
                    .filter_map(|s| stream_to_source(s, "cache"))
                    .collect();
                for source in &mut results {
                    source.score = compute_score(source);
                }
                results.sort_by(|a, b| b.score.cmp(&a.score));
                return Ok(Json(json!({
                    "results":   results,
                    "cached_at": cache_result.cached_at,
                    "is_stale":  false,
                })));
            }

            // Cache périmé → stale-while-revalidate :
            // 1. Retourner les anciens résultats immédiatement (is_stale: true)
            // 2. Lancer une nouvelle recherche en background
            let mut stale_results: Vec<Source> = cache_result.streams.iter()
                .filter_map(|s| stream_to_source(s, "cache"))
                .collect();
            for source in &mut stale_results {
                source.score = compute_score(source);
            }
            stale_results.sort_by(|a, b| b.score.cmp(&a.score));

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

    // ── Aucun cache (ou force=true) → recherche fraîche ─────────────────────
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

// ── Recherche complète + mise en cache ───────────────────────────────────────
// Retourne les sources frontend triées par score décroissant.
// Effet de bord : met à jour le cache SQLite.
async fn do_fresh_fetch(
    id: &str,
    content_type: &ContentType,
    season: Option<u32>,
    episode: Option<u32>,
    cache_key: &str,
    state: &Arc<AppState>,
) -> Result<Vec<Source>, AppError> {
    // Résolution TMDB → IMDB pour Torrentio (qui n'accepte que "tt...")
    let imdb_id = tmdb::resolve_to_imdb_id(id, content_type, state).await;

    // Titre pour Prowlarr (recherche par nom)
    let prowlarr_query = tmdb::resolve_title_for_prowlarr(id, content_type, state).await.ok();
    let expected_title_for_match = prowlarr_query
        .as_deref()
        .map(extract_expected_title);

    let torrentio_id = imdb_id.as_deref().unwrap_or(id);

    // Torrentio : timeout 20s — Prowlarr : timeout 12s (recherche indexeurs)
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

    // Mettre en cache avant dédoublonnage (toutes les sources)
    let all_for_cache: Vec<crate::models::Stream> = torrentio_streams.iter()
        .chain(prowlarr_streams.iter())
        .cloned()
        .collect();

    // Taguer chaque stream avec son nom de source
    let mut tagged: Vec<(crate::models::Stream, String)> = Vec::new();
    for s in torrentio_streams { tagged.push((s, "torrentio".to_string())); }
    for s in prowlarr_streams  { tagged.push((s, "prowlarr".to_string())); }

    // Dédoublonnage par info_hash
    let mut seen_hashes = HashSet::new();
    let mut unique: Vec<(crate::models::Stream, String)> = Vec::new();
    for (stream, src) in tagged {
        if let Some(hash) = &stream.info_hash {
            if !seen_hashes.contains(hash) {
                seen_hashes.insert(hash.clone());
                unique.push((stream, src));
            }
        } else {
            unique.push((stream, src));
        }
    }

    let mut all_sources: Vec<Source> = unique.iter()
        .filter_map(|(stream, src)| stream_to_source(stream, src))
        .collect();

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

    let mut seen_url_only = HashSet::new();
    all_sources.retain(|source| {
        if !source.info_hash.is_empty() {
            return true;
        }
        let Some(magnet) = source.magnet.as_ref() else {
            return true;
        };
        if magnet.is_empty() {
            return true;
        }
        seen_url_only.insert(magnet.clone())
    });

    if let Some(expected_title) = expected_title_for_match.as_deref() {
        all_sources.retain(|source| {
            if source.source != "prowlarr" {
                return true;
            }
            compute_title_relevance_penalty(&source.title, expected_title) < 1000
        });
    }

    for source in &mut all_sources {
        source.score = compute_score(source);
        if source.source == "prowlarr" {
            if let Some(expected_title) = expected_title_for_match.as_deref() {
                let relevance_penalty = compute_title_relevance_penalty(&source.title, expected_title);
                source.score = source.score.saturating_sub(relevance_penalty);
            }
        }
    }
    all_sources.sort_by(|a, b| b.score.cmp(&a.score));

    if !all_for_cache.is_empty() {
        cache::cache_streams(cache_key, &all_for_cache, &state.db).await?;
    }

    Ok(all_sources)
}

// ── Helpers de tri ────────────────────────────────────────────────────────────

fn compute_score(source: &Source) -> u32 {
    let mut score: u32 = 0;
    let upper_title = source.title.to_uppercase();
    let upper_language = source.language.to_uppercase();
    let normalized_quality = source.quality.to_lowercase();

    score += match normalized_quality.as_str() {
        "4k" | "2160p" => 1000,
        "1080p" => 700,
        "720p" => 400,
        "480p" => 100,
        _ => 50,
    };

    if upper_title.contains("BLURAY") || upper_title.contains("BLU-RAY") {
        score += 300;
    } else if upper_title.contains("WEB-DL") || upper_title.contains("WEBDL") {
        score += 200;
    } else if upper_title.contains("WEBRIP") {
        score += 150;
    } else if upper_title.contains("HDTV") {
        score += 80;
    }

    if upper_title.contains("REMUX") {
        score += 250;
    } else if upper_title.contains("HEVC") || upper_title.contains("X265") {
        score += 80;
    } else if upper_title.contains("X264") || upper_title.contains("H264") {
        score += 60;
    }

    if upper_title.contains("DV") || upper_title.contains("DOLBY VISION") {
        score += 120;
    } else if upper_title.contains("HDR") {
        score += 80;
    }

    score += source.seeders.min(500) / 10;

    score += match upper_language.as_str() {
        "FR" | "TRUEFRENCH" | "VFF" => 500,
        "MULTI" => 300,
        "VOSTFR" => 100,
        "EN" => 50,
        _ => 0,
    };

    if source.cached_rd {
        score += 400;
    }

    if source.size_gb > 1.0 && source.size_gb < 60.0 {
        score += 50;
    }

    if upper_title.contains("HDCAM")
        || upper_title.contains("CAMRIP")
        || upper_title.contains(".CAM.")
        || upper_title.contains("-CAM-")
    {
        score = score.saturating_sub(800);
    }
    if upper_title.contains(".TS.")
        || upper_title.contains("-TS-")
        || upper_title.contains("TELESYNC")
    {
        score = score.saturating_sub(700);
    }
    if upper_title.contains(".SCR.")
        || upper_title.contains("-SCR-")
        || upper_title.contains("SCREENER")
    {
        score = score.saturating_sub(600);
    }
    if upper_title.contains("HDTC") || upper_title.contains("HC.HD") {
        score = score.saturating_sub(500);
    }
    if source.seeders == 0 {
        score = score.saturating_sub(400);
    }

    score
}

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

// ── Conversion Stream interne → format Source frontend ───────────────────────

fn stream_to_source(stream: &crate::models::Stream, source_name: &str) -> Option<Source> {
    let info_hash = stream.info_hash.as_deref().unwrap_or("");
    let title = stream.title.as_deref().unwrap_or("Source inconnue");

    // playable = peut être lancé via pipeline RD (besoin d'un info_hash)
    // ou directement si l'URL est déjà streamable (torrentio/RD résolues)
    let playable = !info_hash.is_empty() || stream.url.as_deref().map_or(false, |u| {
        u.contains("torrentio.strem.fun") ||
        u.contains("real-debrid.com") ||
        u.contains("rdeb.io")
    });

    // Générer le lien magnet depuis l'info_hash, ou utiliser l'URL directe
    let magnet = if !info_hash.is_empty() {
        let encoded_title = title.lines().next().unwrap_or("").replace(' ', "+");
        Some(format!("magnet:?xt=urn:btih:{}&dn={}", info_hash, encoded_title))
    } else {
        stream.url.clone()
    };

    // cached_rd = true UNIQUEMENT pour les URLs Torrentio/RD déjà résolues
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
        info_hash: info_hash.to_string(),
        magnet,
        source: source_name.to_string(),
        cached_rd,
        playable,
        rd_link: None,
        score: 0,
    })
}
