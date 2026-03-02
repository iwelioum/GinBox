use axum::{
    extract::{State, Path},
    response::Json,
    routing::{post, get},
    Router,
};
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::services::trakt;
use crate::models::{DeviceAuthResponse, TraktTokens, TraktReviewsResponse};
use serde::Deserialize;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/auth/start", post(start_device_auth))
        .route("/auth/poll", post(poll_device_auth))
        .route("/scrobble/start", post(scrobble_start))
        .route("/scrobble/pause", post(scrobble_pause))
        .route("/scrobble/stop", post(scrobble_stop))
        .route("/:content_type/:id/reviews", get(get_reviews))
}

#[derive(Deserialize)]
pub struct PollAuthRequest {
    pub device_code: String,
    pub profile_id: i64,
}

#[derive(Deserialize)]
pub struct ScrobbleRequest {
    pub profile_id: i64,
    pub content_id: String,
    pub content_type: String,
    pub progress: f32,
}

async fn start_device_auth(State(state): State<Arc<AppState>>) -> Result<Json<DeviceAuthResponse>, AppError> {
    let res = trakt::start_device_auth(&state).await?;
    Ok(Json(res))
}

async fn poll_device_auth(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PollAuthRequest>,
) -> Result<Json<TraktTokens>, AppError> {
    let tokens = trakt::poll_device_auth(&payload.device_code, payload.profile_id, &state).await?;
    Ok(Json(tokens))
}

async fn scrobble_start(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ScrobbleRequest>,
) -> Result<(), AppError> {
    trakt::scrobble_start(payload.profile_id, &payload.content_id, &payload.content_type, payload.progress, &state).await?;
    Ok(())
}

async fn scrobble_pause(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ScrobbleRequest>,
) -> Result<(), AppError> {
    trakt::scrobble_pause(payload.profile_id, &payload.content_id, &payload.content_type, payload.progress, &state).await?;
    Ok(())
}

async fn scrobble_stop(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ScrobbleRequest>,
) -> Result<(), AppError> {
    trakt::scrobble_stop(payload.profile_id, &payload.content_id, &payload.content_type, payload.progress, &state).await?;
    Ok(())
}

async fn get_reviews(
    State(state): State<Arc<AppState>>,
    Path((content_type, id)): Path<(String, String)>,
) -> Result<Json<TraktReviewsResponse>, AppError> {
    let data = trakt::get_reviews(&content_type, &id, &state).await?;
    Ok(Json(data))
}