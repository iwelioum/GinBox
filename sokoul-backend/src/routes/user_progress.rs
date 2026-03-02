// ══════════════════════════════════════════════════════════
// routes/user_progress.rs — Progression utilisateur par profil
// GET  /user/progress?profile_id=N  → liste des entrées
// POST /user/progress               → upsert (créer ou mettre à jour)
// ══════════════════════════════════════════════════════════

use axum::{
    extract::{Query, State},
    response::Json,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::Deserialize;

use crate::AppState;
use crate::errors::AppError;
use crate::models::{UserProgress, SetProgressRequest};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_progress))
        .route("/", post(set_progress))
}

#[derive(Deserialize)]
pub struct GetProgressQuery {
    pub profile_id: i64,
}

async fn get_progress(
    Query(params): Query<GetProgressQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<UserProgress>>, AppError> {
    let rows = sqlx::query_as::<_, UserProgress>(
        "SELECT id, profile_id, content_id, status, progress, rating, updated_at \
         FROM user_progress WHERE profile_id = ? ORDER BY updated_at DESC",
    )
    .bind(params.profile_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows))
}

async fn set_progress(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SetProgressRequest>,
) -> Result<Json<UserProgress>, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let progress = req.progress.unwrap_or(0.0);

    sqlx::query(
        "INSERT INTO user_progress (profile_id, content_id, status, progress, rating, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?) \
         ON CONFLICT(profile_id, content_id) DO UPDATE SET \
           status = excluded.status, \
           progress = excluded.progress, \
           rating = excluded.rating, \
           updated_at = excluded.updated_at",
    )
    .bind(req.profile_id)
    .bind(&req.content_id)
    .bind(&req.status)
    .bind(progress)
    .bind(req.rating)
    .bind(now)
    .execute(&state.db)
    .await?;

    let row = sqlx::query_as::<_, UserProgress>(
        "SELECT id, profile_id, content_id, status, progress, rating, updated_at \
         FROM user_progress WHERE profile_id = ? AND content_id = ?",
    )
    .bind(req.profile_id)
    .bind(&req.content_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(row))
}
