use axum::{
    extract::{Path, State, Query},
    response::Json,
    routing::{get, delete, put},
    Router,
};
use std::sync::Arc;
use serde::Deserialize;
use crate::AppState;
use crate::errors::AppError;
use crate::services::lists;
use crate::models::{UserList, ListItem, ContentType};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_all_lists).post(post_new_list))
        .route("/:id", delete(delete_list))
        .route("/:id/rename", put(put_rename_list))
        .route("/:id/items", get(get_list_items).post(post_list_item))
        .route("/:id/items/:content_id", delete(delete_list_item))
        .route("/content/:content_id/status", get(get_content_lists_status))
}

#[derive(Deserialize)]
pub struct ProfileIdQuery {
    profile_id: i64,
}

#[derive(Deserialize)]
pub struct CreateListRequest {
    name: String,
    profile_id: i64,
}

#[derive(Deserialize)]
pub struct RenameListRequest {
    name: String,
    profile_id: i64,
}

#[derive(Deserialize)]
pub struct AddItemRequest {
    content_id: String,
    content_type: ContentType,
    title: String,
    poster_url: Option<String>,
}

async fn get_all_lists(
    Query(query): Query<ProfileIdQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<UserList>>, AppError> {
    let user_lists = lists::get_lists(query.profile_id, &state.db).await?;
    Ok(Json(user_lists))
}

async fn post_new_list(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateListRequest>,
) -> Result<Json<UserList>, AppError> {
    let user_list = lists::create_list(payload.profile_id, &payload.name, &state.db).await?;
    Ok(Json(user_list))
}

async fn delete_list(
    Path(id): Path<i64>,
    Query(query): Query<ProfileIdQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<(), AppError> {
    lists::delete_list(id, query.profile_id, &state.db).await?;
    Ok(())
}

async fn put_rename_list(
    Path(id): Path<i64>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RenameListRequest>,
) -> Result<Json<UserList>, AppError> {
    let user_list = lists::rename_list(id, payload.profile_id, &payload.name, &state.db).await?;
    Ok(Json(user_list))
}

async fn get_list_items(
    Path(id): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<ListItem>>, AppError> {
    let items = lists::get_list_items(id, &state.db).await?;
    Ok(Json(items))
}

async fn post_list_item(
    Path(id): Path<i64>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AddItemRequest>,
) -> Result<Json<ListItem>, AppError> {
    let item = lists::add_to_list(
        id,
        &payload.content_id,
        &payload.content_type.to_string(),
        &payload.title,
        payload.poster_url.as_deref(),
        &state.db,
    ).await?;
    Ok(Json(item))
}

async fn delete_list_item(
    Path((list_id, content_id)): Path<(i64, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<(), AppError> {
    lists::remove_from_list(list_id, &content_id, &state.db).await?;
    Ok(())
}

async fn get_content_lists_status(
    Path(content_id): Path<String>,
    Query(query): Query<ProfileIdQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<i64>>, AppError> {
    let list_ids = lists::get_content_lists(query.profile_id, &content_id, &state.db).await?;
    Ok(Json(list_ids))
}