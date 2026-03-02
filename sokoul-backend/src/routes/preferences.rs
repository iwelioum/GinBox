use axum::{
    extract::{Query, State},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::services::preferences;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_all_preferences))
        .route("/set", post(set_single_preference))
}

#[derive(Deserialize)]
pub struct ProfileIdQuery {
    profile_id: i64,
}

#[derive(Deserialize)]
pub struct SetPreferenceRequest {
    profile_id: i64,
    key: String,
    value: String,
}

async fn get_all_preferences(
    Query(query): Query<ProfileIdQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<HashMap<String, String>>, AppError> {
    let prefs = preferences::get_preferences(query.profile_id, &state.db).await?;
    Ok(Json(prefs))
}

async fn set_single_preference(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SetPreferenceRequest>,
) -> Result<(), AppError> {
    preferences::set_preference(payload.profile_id, &payload.key, &payload.value, &state.db).await?;
    Ok(())
}