// ══════════════════════════════════════════════════════════
// debrid.rs — Real-Debrid Routes
// RULES:
//   POST /debrid/:info_hash  → complete magnet pipeline (add → wait → unrestrict)
//   POST /debrid/unrestrict  → direct unrestrict of RD-hosted link
// Enhanced responses: { stream_url, is_cached }
// ══════════════════════════════════════════════════════════

use axum::{
    extract::{Path, State},
    response::Json,
    routing::post,
    Router,
};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::models::Stream;
use crate::services::realdebrid;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Specific route BEFORE parameterized route
        .route("/unrestrict", post(post_unrestrict))
        .route("/:info_hash", post(post_debrid))
}

// ── POST /debrid/:info_hash ─────────────────────────────────────────────────
// Complete pipeline: magnet → add RD → cache probe → unrestrict → direct URL
pub async fn post_debrid(
    Path(info_hash): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let stream_stub = Stream {
        info_hash: Some(info_hash),
        url: None,
        file_idx: None,
        title: None,
        parsed_meta: crate::parser::parse_stream_title(""),
        behavior_hints: None,
    };
    let result = realdebrid::get_direct_link(&stream_stub, &state).await?;
    Ok(Json(json!({ "url": result.url, "is_cached": result.is_cached })))
}

// ── POST /debrid/unrestrict ─────────────────────────────────────────────────
// Body: { "magnet": "magnet:?xt=...", "cached": true/false }
// Returns: { "stream_url": "<direct-url>", "is_cached": bool }
// Single entry point from usePlayback.ts → endpoints.debrid.unrestrict(magnet, cached)
#[derive(Deserialize)]
pub struct UnrestrictBody {
    pub magnet: String,
    #[allow(dead_code)]  // used client-side for UX (status messages)
    pub cached: bool,
}

pub async fn post_unrestrict(
    State(state): State<Arc<AppState>>,
    Json(body): Json<UnrestrictBody>,
) -> Result<Json<serde_json::Value>, AppError> {
    let magnet_raw = body.magnet.trim();
    tracing::info!("Unrestricting request received for: {}", magnet_raw);

    // Case 1: direct magnet link
    if magnet_raw.starts_with("magnet:") {
        let info_hash = extract_info_hash(magnet_raw)
            .ok_or_else(|| AppError::NotFound("Unable to extract info_hash from magnet link".into()))?;

        tracing::info!("Processing magnet via info_hash: {}", info_hash);
        let stream_stub = Stream {
            info_hash: Some(info_hash),
            url: None,
            file_idx: None,
            title: None,
            parsed_meta: crate::parser::parse_stream_title(""),
            behavior_hints: None,
        };
        let result = realdebrid::get_direct_link(&stream_stub, &state).await?;
        return Ok(Json(json!({ "stream_url": result.url, "is_cached": result.is_cached })));
    }

    // Case 2: HTTP URL (Prowlarr or RD)
    if magnet_raw.starts_with("http") {
        // Handle localhost URLs (Prowlarr)
        if magnet_raw.contains("localhost") || magnet_raw.contains("127.0.0.1") {
            tracing::info!("Prowlarr link detected, attempting torrent download...");
            let resp = state.http_client.get(magnet_raw).send().await
                .map_err(|e| AppError::NetworkError(format!("Failed Prowlarr download: {}", e)))?;
            
            let bytes = resp.bytes().await
                .map_err(|e| AppError::NetworkError(format!("Failed reading Prowlarr bytes: {}", e)))?;
            
            // Some indexers return a text file containing a magnet: instead of a binary torrent
            if bytes.starts_with(b"magnet:") {
                let magnet_str = String::from_utf8_lossy(&bytes);
                tracing::info!("Prowlarr link returned a text magnet link: {}", magnet_str);
                if let Some(info_hash) = extract_info_hash(&magnet_str) {
                    let stream_stub = Stream {
                        info_hash: Some(info_hash),
                        url: None,
                        file_idx: None,
                        title: None,
                        parsed_meta: crate::parser::parse_stream_title(""),
                        behavior_hints: None,
                    };
                    let result = realdebrid::get_direct_link(&stream_stub, &state).await?;
                    return Ok(Json(json!({ "stream_url": result.url, "is_cached": result.is_cached })));
                }
            }

            // Validation: a bencoded .torrent file ALWAYS starts with 'd'
            if !bytes.starts_with(b"d") {
                let preview = String::from_utf8_lossy(&bytes[..bytes.len().min(200)]);
                tracing::error!("Prowlarr did not return a valid .torrent file ({} bytes). Start: {}", bytes.len(), &preview[..preview.len().min(100)]);
                return Err(AppError::ExternalApiError(
                    "The Prowlarr source did not provide a valid .torrent file (the indexer may have returned an error). Try another source.".into()
                ));
            }

            // Treat as binary .torrent file
            tracing::info!("Sending binary torrent file to Real-Debrid ({} bytes)...", bytes.len());
            let result = realdebrid::get_direct_link_from_file(bytes.to_vec(), &state).await?;
            return Ok(Json(json!({ "stream_url": result.url, "is_cached": result.is_cached })));
        }

        // Already Real-Debrid or rdeb.io link
        if magnet_raw.contains("real-debrid.com") || magnet_raw.contains("rdeb.io") {
            tracing::info!("Direct Real-Debrid link detected, immediate unrestrict.");
            let result = realdebrid::unrestrict_link(magnet_raw, &state).await?;
            return Ok(Json(json!({ "stream_url": result.download, "is_cached": true })));
        }
        
        // Torrentio resolve URL or other known streaming URL
        if magnet_raw.contains("torrentio.strem.fun") {
            tracing::info!("Torrentio resolved link detected: {}", magnet_raw);
            return Ok(Json(json!({ "stream_url": magnet_raw, "is_cached": true })));
        }

        tracing::warn!("Rejecting unknown HTTP URL: {}", magnet_raw);
        return Err(AppError::BadRequest(
            "Unknown HTTP URL — only magnet:, Real-Debrid, Prowlarr, and Torrentio links are accepted".into()
        ));
    }

    tracing::warn!("Unrecognized link format: {}", magnet_raw);
    Err(AppError::NotFound("Unrecognized link format (must be magnet: or http)".into()))
}

// ── Extract info_hash from magnet link ──────────────────────────────
fn extract_info_hash(magnet: &str) -> Option<String> {
    // Standard format: magnet:?xt=urn:btih:<HASH>&...
    for part in magnet.split('&') {
        let part = part.trim_start_matches("magnet:?");
        if part.starts_with("xt=urn:btih:") {
            let hash = part.trim_start_matches("xt=urn:btih:");
            // Stop at the next '&' if present
            let hash = hash.split('&').next().unwrap_or(hash);
            return Some(hash.to_lowercase());
        }
    }
    None
}
