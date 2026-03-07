use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::services::playback;
use crate::models::PlaybackEntry;
use serde::Deserialize;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/position", post(post_position))
        .route("/position/:content_id", get(get_position))
        .route("/history", get(get_history))
}

#[derive(Deserialize)]
pub struct SavePositionRequest {
    pub profile_id: i64,
    pub content_id: String,
    pub content_type: String,
    #[serde(default)]
    pub season: Option<u32>,
    #[serde(default)]
    pub episode: Option<u32>,
    pub position_ms: i64,
    pub duration_ms: i64,
    #[serde(default)]
    pub episode_title: Option<String>,
    #[serde(default)]
    pub still_path: Option<String>,
}

#[derive(Deserialize)]
pub struct GetPositionQuery {
    pub profile_id: i64,
    #[serde(default)]
    pub season: Option<u32>,
    #[serde(default)]
    pub episode: Option<u32>,
}

#[derive(Deserialize)]
pub struct GetHistoryQuery {
    pub profile_id: i64,
    pub limit: u32,
}

async fn post_position(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SavePositionRequest>,
) -> Result<(), AppError> {
    playback::save_position(
        payload.profile_id,
        &payload.content_id,
        &payload.content_type,
        payload.season,
        payload.episode,
        payload.position_ms,
        payload.duration_ms,
        payload.episode_title.as_deref(),
        payload.still_path.as_deref(),
        &state.db,
    ).await?;
    Ok(())
}

async fn get_position(
    Path(content_id): Path<String>,
    Query(query): Query<GetPositionQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Option<PlaybackEntry>>, AppError> {
    let entry = playback::get_position(
        query.profile_id,
        &content_id,
        query.season,
        query.episode,
        &state.db,
    )
    .await?;
    Ok(Json(entry))
}

async fn get_history(
    Query(query): Query<GetHistoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<PlaybackEntry>>, AppError> {
    let history = playback::get_history(query.profile_id, query.limit, &state.db).await?;
    Ok(Json(history))
}
