// ══════════════════════════════════════════════════════════════
// artwork.rs — GET /artwork/:media_type/:tmdb_id
//
// Returns an ArtworkBundle with the best URL from each provider
// for poster, logo, backdrop, and banner slots.
//
// Cache: SQLite, 7-day TTL.
// Errors: always 200 — missing/failed providers return nulls.
// ══════════════════════════════════════════════════════════════

use axum::{
    extract::{Path, State},
    response::Json,
    routing::get,
    Router,
};
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::services::artwork_resolver::{self, ArtworkBundle};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/:media_type/:tmdb_id", get(get_artwork_handler))
}

// ── GET /artwork/:media_type/:tmdb_id ─────────────────────────

pub async fn get_artwork_handler(
    Path((media_type, tmdb_id_str)): Path<(String, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<ArtworkBundle>, AppError> {
    let is_movie = media_type != "tv" && media_type != "series";

    // Normalise to canonical key used in cache ("movie" | "tv")
    let cache_type = if is_movie { "movie" } else { "tv" };

    let tmdb_id: i64 = tmdb_id_str
        .strip_prefix("tmdb:")
        .unwrap_or(&tmdb_id_str)
        .parse()
        .unwrap_or(0);

    if tmdb_id == 0 {
        return Ok(Json(ArtworkBundle::default()));
    }

    // ── Cache hit ────────────────────────────────────────────────
    if let Some(cached) = artwork_resolver::get_cached(&tmdb_id_str, cache_type, &state.db).await {
        return Ok(Json(cached));
    }

    // ── Cache miss — resolve from all providers ──────────────────
    let bundle = artwork_resolver::resolve(tmdb_id, is_movie, &state).await;

    artwork_resolver::store_cached(&tmdb_id_str, cache_type, &bundle, &state.db).await;

    Ok(Json(bundle))
}
