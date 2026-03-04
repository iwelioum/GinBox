// ══════════════════════════════════════════════════════════
// fanart.rs — Logo HD depuis Fanart.tv
// Accepte deux formats :
//   GET /fanart/:type/:id  (ex: /fanart/movie/tmdb:550)
//   GET /fanart/:id        (ex: /fanart/tt0137523 — legacy)
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
        // Logo avec cache SQLite : /fanart/:type/:id/logo
        .route("/:content_type/:id/logo", get(get_logo_handler))
        // Format préféré du frontend : /fanart/:type/:id
        .route("/:content_type/:id", get(get_fanart_handler))
}

// ── GET /fanart/:type/:id ─────────────────────────────────
// Ce handler retourne maintenant la réponse JSON complète de Fanart.tv
pub async fn get_fanart_handler(
    Path((content_type, id)): Path<(String, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, AppError> {

    let is_movie = content_type != "series" && content_type != "tv";

    // L'ID peut être "tmdb:12345" ou juste "12345"
    let tmdb_id: Option<i64> = if let Some(s) = id.strip_prefix("tmdb:") {
        s.parse().ok()
    } else {
        id.parse().ok()
    };

    // Si on n'a pas un tmdb_id valide, on ne peut rien faire.
    let Some(tmdb_id) = tmdb_id else {
        return Ok(Json(Value::Null));
    };

    let fanart_data = fanart::fetch_all_fanart_data(
        tmdb_id,
        is_movie,
        &state.fanart_key,
        &state.http_client,
    ).await?;

    Ok(Json(fanart_data))
}

// ── GET /fanart/:type/:id/logo ─────────────────────────────────
// Retourne le meilleur logo HD (fr > en > autre) avec cache SQLite 30 jours.
// Nécessite un IMDB ID résolu via TMDB external_ids.
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

    // Résout l'IMDB ID (clé de cache) via TMDB
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

    // Vérifie le cache SQLite (cache négatif inclus : logo_url == "")
    if let Ok(Some(cached)) = fanart::get_cached_logo(&imdb_id, &state.db).await {
        let v = if cached.is_empty() { Value::Null } else { Value::String(cached) };
        return Ok(Json(v));
    }

    // Cache miss : fetch Fanart.tv + mise en cache
    let logo = fanart::fetch_and_cache_logo(
        &imdb_id, tmdb_id, is_movie,
        &state.fanart_key, &state.http_client, &state.db,
    ).await?;

    Ok(Json(logo.map(Value::String).unwrap_or(Value::Null)))
}
