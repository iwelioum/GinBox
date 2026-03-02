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
