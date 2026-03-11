// ══════════════════════════════════════════════════════════
// services/wastream.rs — Wastream DDL proxy provider
// RULES:
//   → Silent failure (returns [] if offline or misconfigured)
//   → WASTREAM_URL must include credentials: http://host/{uuid}/{enc_pw}
//   → Returns Source directly (no info_hash, playable=true)
//   → URLs are wastream playback proxy links — not cached in RD
// ══════════════════════════════════════════════════════════

use crate::models::{ContentType, Source};
use crate::AppState;
use std::sync::Arc;

#[derive(serde::Deserialize)]
struct WastreamResponse {
    #[serde(default)]
    streams: Vec<WastreamStream>,
}

#[derive(serde::Deserialize)]
struct WastreamStream {
    #[serde(default)]
    name: String,
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    url: Option<String>,
}

/// Fetches DDL streams from a running Wastream instance.
/// Returns an empty Vec (silently) if Wastream is offline, unconfigured, or returns an error.
pub async fn fetch_wastream_streams(
    imdb_id: &str,
    content_type: &ContentType,
    season: Option<u32>,
    episode: Option<u32>,
    state: &Arc<AppState>,
) -> Vec<Source> {
    let base_url = &state.wastream_url;
    if base_url.is_empty() {
        return vec![];
    }

    let ct_str = match content_type {
        ContentType::Movie  => "movie",
        ContentType::Series => "series",
    };

    // Stremio content ID format: "ttXXXXX" for movies, "ttXXXXX:S:E" for series
    let content_id = match (content_type, season, episode) {
        (ContentType::Series, Some(s), Some(e)) => format!("{}:{}:{}", imdb_id, s, e),
        _ => imdb_id.to_string(),
    };

    let url = format!("{}/stream/{}/{}.json", base_url, ct_str, content_id);

    let resp = match state
        .http_client
        .get(&url)
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            tracing::warn!("Wastream unreachable: {e}");
            return vec![];
        }
    };

    if !resp.status().is_success() {
        tracing::warn!("Wastream returned HTTP {}", resp.status());
        return vec![];
    }

    let data: WastreamResponse = match resp.json().await {
        Ok(d) => d,
        Err(e) => {
            tracing::warn!("Wastream parse error: {e}");
            return vec![];
        }
    };

    data.streams
        .into_iter()
        .filter_map(wastream_to_source)
        .collect()
}

fn wastream_to_source(s: WastreamStream) -> Option<Source> {
    let url = s.url?;

    // Concatenate name + title for metadata extraction (quality, language, size)
    let meta_text = match &s.title {
        Some(t) => format!("{} {}", s.name, t),
        None    => s.name.clone(),
    };

    let parsed = crate::parser::parse_stream_title(&meta_text);

    // Display title: prefer the release name from `title`, fallback to `name`
    let display_title = s.title.unwrap_or(s.name);

    Some(Source {
        title: display_title,
        quality: parsed.quality,
        size_gb: parsed.size_gb,
        // DDL has no seeders — use 1 so filter_sources doesn't drop this entry
        seeders: 1,
        language: parsed.language,
        language_variant: parsed.language_variant,
        info_hash: String::new(),
        // magnet stores the direct playback URL for wastream sources
        magnet: Some(url),
        source: "wastream".to_string(),
        // Not in RD cache — wastream resolves via its own debrid (AllDebrid/Torbox)
        cached_rd: false,
        // URL is ready to play through wastream's playback proxy
        playable: true,
        rd_link: None,
        score: 0,
    })
}
