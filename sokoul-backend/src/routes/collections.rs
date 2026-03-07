use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::get,
    Router,
};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::services::tmdb;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/all",  get(get_collections))
        .route("/:id",  get(get_collection_detail))
}

#[derive(Deserialize)]
pub struct ListQuery {
    pub page:  Option<u32>,
    pub limit: Option<u32>,
}

// GET /collections/all?page=1&limit=24
async fn get_collections(
    Query(query): Query<ListQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let page  = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(24).min(50);

    let all_ids = tmdb::POPULAR_COLLECTION_IDS;
    let total   = all_ids.len();
    let total_pages = (total as f64 / limit as f64).ceil() as u32;

    let start = ((page - 1) * limit) as usize;
    let end   = (start + limit as usize).min(total);

    if start >= total {
        return Ok(Json(json!({
            "collections": [],
            "total_pages":   total_pages,
            "total_results": total,
        })));
    }

    let page_ids = &all_ids[start..end];

    // Fetch collection summaries sequentially (each is a simple TMDB call)
    let mut collections = Vec::with_capacity(page_ids.len());
    for &id in page_ids {
        if let Ok(summary) = tmdb::fetch_collection_summary(id, &state).await {
            collections.push(summary);
        }
    }

    Ok(Json(json!({
        "collections":   collections,
        "total_pages":   total_pages,
        "total_results": total,
    })))
}

// GET /collections/:id
async fn get_collection_detail(
    Path(id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let detail = tmdb::fetch_collection_detail(id, &state).await?;
    Ok(Json(detail))
}
