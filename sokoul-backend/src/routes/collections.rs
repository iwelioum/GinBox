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

    // Fetch collection summaries in parallel using JoinSet
    let mut set = tokio::task::JoinSet::new();
    for (idx, &id) in page_ids.iter().enumerate() {
        let state = Arc::clone(&state);
        set.spawn(async move {
            (idx, tmdb::fetch_collection_summary(id, &state).await)
        });
    }
    let mut indexed_results: Vec<(usize, _)> = Vec::with_capacity(page_ids.len());
    while let Some(Ok((idx, result))) = set.join_next().await {
        if let Ok(summary) = result {
            indexed_results.push((idx, summary));
        }
    }
    indexed_results.sort_by_key(|(idx, _)| *idx);
    let collections: Vec<_> = indexed_results.into_iter().map(|(_, s)| s).collect();

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
