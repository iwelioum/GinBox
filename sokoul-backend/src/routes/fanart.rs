// ══════════════════════════════════════════════════════════
// fanart.rs — HD Logo from Fanart.tv
// Accepts two formats:
//   GET /fanart/:type/:id  (e.g. /fanart/movie/tmdb:550)
//   GET /fanart/:id        (e.g. /fanart/tt0137523 — legacy)
// ══════════════════════════════════════════════════════════

use axum::{
    extract::{Path, State},
    response::Json,
    routing::get,
    Router,
};
use serde_json::Value;
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::services::fanart;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Logo with SQLite cache: /fanart/:type/:id/logo
        .route("/:content_type/:id/logo", get(get_logo_handler))
        // Preferred frontend format: /fanart/:type/:id
        .route("/:content_type/:id", get(get_fanart_handler))
}

// ── GET /fanart/:type/:id ─────────────────────────────────
// Returns the full Fanart.tv JSON response.
// IMPORTANT: Fanart.tv /v3/movies/{id} expects a TMDB ID,
//            but /v3/tv/{id} expects a TVDB ID.
//            For series, we first resolve the TVDB ID via TMDB external_ids.
pub async fn get_fanart_handler(
    Path((content_type, id)): Path<(String, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, AppError> {

    let is_movie = content_type != "series" && content_type != "tv";

    // The ID can be "tmdb:12345" or just "12345"
    let tmdb_id: i64 = {
        let raw = id.strip_prefix("tmdb:").unwrap_or(&id);
        match raw.parse::<i64>() {
            Ok(v) => v,
            Err(_) => return Ok(Json(Value::Null)),
        }
    };

    // For series, Fanart.tv requires the TVDB ID (not the TMDB ID).
    // We resolve it via the TMDB external_ids endpoint.
    let fanart_id: i64 = if is_movie {
        tmdb_id
    } else {
        let ext_url = format!(
            "https://api.themoviedb.org/3/tv/{tmdb_id}/external_ids?api_key={}",
            state.tmdb_key
        );
        let ext: Value = state.http_client
            .get(&ext_url)
            .send().await
            .map_err(|e| AppError::NetworkError(e.to_string()))?
            .json().await
            .unwrap_or(Value::Null);

        match ext["tvdb_id"].as_i64().filter(|&v| v > 0) {
            Some(tvdb) => tvdb,
            None => return Ok(Json(Value::Null)), // no TVDB ID → Fanart.tv cannot do anything
        }
    };

    let fanart_data = fanart::fetch_all_fanart_data(
        fanart_id,
        is_movie,
        &state.fanart_key,
        &state.http_client,
    ).await?;

    Ok(Json(fanart_data))
}

// ── GET /fanart/:type/:id/logo ─────────────────────────────────
// Returns the best HD logo (fr > en > other) with 30-day SQLite cache.
// Requires an IMDB ID resolved via TMDB external_ids.
pub async fn get_logo_handler(
    Path((content_type, id)): Path<(String, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, AppError> {
    let is_movie = content_type != "series" && content_type != "tv";

    let tmdb_id: Option<i64> = if let Some(s) = id.strip_prefix("tmdb:") {
        s.parse().ok()
    } else {
        id.parse().ok()
    };

    let Some(tmdb_id) = tmdb_id else {
        return Ok(Json(Value::Null));
    };

    // Resolve IMDB ID (cache key) via TMDB
    let kind = if is_movie { "movie" } else { "tv" };
    let ext_url = format!(
        "https://api.themoviedb.org/3/{kind}/{tmdb_id}/external_ids?api_key={}",
        state.tmdb_key
    );
    let ext_json: Value = state.http_client.get(&ext_url).send().await
        .map_err(|e| AppError::NetworkError(e.to_string()))?
        .json().await
        .map_err(|e| AppError::ParseError(e.to_string()))?;

    let imdb_id = match ext_json["imdb_id"].as_str() {
        Some(s) if !s.is_empty() => s.to_string(),
        _ => return Ok(Json(Value::Null)),
    };

    // Check SQLite cache (negative cache included: logo_url == "")
    if let Ok(Some(cached)) = fanart::get_cached_logo(&imdb_id, &state.db).await {
        let v = if cached.is_empty() { Value::Null } else { Value::String(cached) };
        return Ok(Json(v));
    }

    // Cache miss: fetch Fanart.tv + cache result
    let logo = fanart::fetch_and_cache_logo(
        &imdb_id, tmdb_id, is_movie,
        &state.fanart_key, &state.http_client, &state.db,
    ).await?;

    Ok(Json(logo.map(Value::String).unwrap_or(Value::Null)))
}
