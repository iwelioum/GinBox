use axum::{
    extract::{Path, State},
    response::Json,
    routing::get,
    Router,
};
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::services::profiles;
use crate::models::Profile;
use serde::Deserialize;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_profiles).post(create_profile))
        .route("/:id", get(get_profile).put(update_profile).delete(delete_profile))
}

#[derive(Deserialize)]
pub struct CreateProfileRequest {
    pub name: String,
    pub avatar_url: Option<String>,
    pub is_kids: bool,
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub name: String,
    pub avatar_url: Option<String>,
}

async fn list_profiles(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Profile>>, AppError> {
    let profiles = profiles::list_profiles(&state.db).await?;
    Ok(Json(profiles))
}

async fn create_profile(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateProfileRequest>,
) -> Result<Json<Profile>, AppError> {
    let profile = profiles::create_profile(&payload.name, payload.avatar_url.as_deref(), payload.is_kids, &state.db).await?;
    Ok(Json(profile))
}

async fn get_profile(
    Path(id): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Profile>, AppError> {
    let profile = profiles::get_profile(id, &state.db).await?;
    Ok(Json(profile))
}

async fn update_profile(
    Path(id): Path<i64>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<Profile>, AppError> {
    let profile = profiles::update_profile(id, &payload.name, payload.avatar_url.as_deref(), &state.db).await?;
    Ok(Json(profile))
}

async fn delete_profile(
    Path(id): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<(), AppError> {
    profiles::delete_profile(id, &state.db).await?;
    Ok(())
}