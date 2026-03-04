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
use crate::models::{ContentType, UnifiedImages};
use crate::services::{tmdb, artwork_providers};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Routes spécifiques AVANT les génériques
        .route("/person/:id/movies",   get(person_movies_handler))
        .route("/:type/meta/:id",      get(meta_handler))
        .route("/:type/:id/credits",   get(credits_handler))
        .route("/:type/:id/images",    get(images_handler))
        // Route générique à 2 segments en dernier
        .route("/:type/:id",           get(catalog_handler))
}

/// Router pour GET /search?q=...&type=...
pub fn search_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(search_handler))
}

#[derive(Deserialize)]
pub struct CatalogQuery {
    pub page:     Option<u32>,
    pub genre:    Option<String>,
    pub q:        Option<String>,
    pub language: Option<String>,
    pub keyword:  Option<String>,
    pub year_gte: Option<String>,
    pub year_lte: Option<String>,
}

// ── GET /catalog/:type/:id ────────────────────────────────────────────────────
// Catalogue : popular / genre / search
pub async fn catalog_handler(
    Path((content_type, id)): Path<(ContentType, String)>,
    Query(query): Query<CatalogQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let page = query.page.unwrap_or(1);
    let result = match id.as_str() {
        "popular"   => tmdb::fetch_popular_catalog(&content_type, page, &state).await?,
        "top_rated" => tmdb::fetch_top_rated_catalog(&content_type, page, &state).await?,
        "genre"   => {
            let genre_str = query.genre.ok_or_else(|| AppError::NotFound("?genre requis".into()))?;
            let genre_id: u32 = genre_str.parse()
                .map_err(|_| AppError::BadRequest(format!("genre invalide : {genre_str}")))?;
            tmdb::fetch_genre_catalog(genre_id, &content_type, page, &state).await?
        }
        "language" => {
            let lang = query.language.ok_or_else(|| AppError::NotFound("?language requis".into()))?;
            tmdb::fetch_discover_catalog(&content_type, page, &state,
                None, Some(&lang), None, None, None).await?
        }
        "keyword" => {
            let kw = query.keyword.ok_or_else(|| AppError::NotFound("?keyword requis".into()))?;
            tmdb::fetch_discover_catalog(&content_type, page, &state,
                None, None, Some(&kw), None, None).await?
        }
        "era" => {
            tmdb::fetch_discover_catalog(&content_type, page, &state,
                None, None, None,
                query.year_gte.as_deref(),
                query.year_lte.as_deref()).await?
        }
        "search"  => {
            let q = query.q.ok_or_else(|| AppError::NotFound("?q requis".into()))?;
            tmdb::search_catalog(&q, &content_type, &state).await?
        }
        other => return Err(AppError::NotFound(format!("Catalogue '{}' introuvable", other))),
    };
    Ok(Json(json!(result)))
}

// ── GET /catalog/:type/meta/:id ───────────────────────────────────────────────
// Fiche complète d'un film ou d'une série
pub async fn meta_handler(
    Path((content_type, id)): Path<(ContentType, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let meta = tmdb::fetch_meta(&id, &content_type, &state).await?;
    Ok(Json(json!(meta)))
}

// ── GET /catalog/:type/:id/credits ────────────────────────────────────────────
// Casting (20 acteurs principaux)
pub async fn credits_handler(
    Path((content_type, id)): Path<(ContentType, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let credits = tmdb::fetch_credits(&id, &content_type, &state).await?;
    Ok(Json(json!(credits)))
}

// ── GET /search?q=...&type=... ─────────────────────────────────────────────────
// Recherche multi (films + séries) ou par type spécifique
#[derive(Deserialize)]
pub struct SearchQuery {
    pub q:    String,
    #[serde(rename = "type")]
    pub kind: Option<String>,
}

pub async fn search_handler(
    Query(query): Query<SearchQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let kind = query.kind.as_deref().unwrap_or("multi");
    let metas = match kind {
        "movie" => {
            let cat = tmdb::search_catalog(&query.q, &ContentType::Movie, &state).await?;
            cat.metas
        }
        "series" | "tv" => {
            let cat = tmdb::search_catalog(&query.q, &ContentType::Series, &state).await?;
            cat.metas
        }
        _ => {
            // multi : films + séries, fusionnés
            let (movies, series) = tokio::join!(
                tmdb::search_catalog(&query.q, &ContentType::Movie, &state),
                tmdb::search_catalog(&query.q, &ContentType::Series, &state),
            );
            let mut combined = Vec::new();
            if let Ok(c) = movies  { combined.extend(c.metas); }
            if let Ok(c) = series  { combined.extend(c.metas); }
            combined
        }
    };
    Ok(Json(json!({ "metas": metas })))
}

// ── GET /catalog/person/:id/movies ─────────────────────────────────────────────
// Filmographie d'un acteur (par ID TMDB de personne)
pub async fn person_movies_handler(
    Path(person_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let metas = tmdb::fetch_person_movies(&person_id, &state).await?;
    Ok(Json(json!({ "metas": metas })))
}

pub async fn images_handler(
    Path((content_type, id)): Path<(ContentType, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<UnifiedImages>, AppError> {
    let tmdb_id_str = id.split(':').last().unwrap_or(&id);
    let tmdb_id: i64 = tmdb_id_str.parse().unwrap_or(0);
    let is_movie = matches!(content_type, ContentType::Movie);
    let images = artwork_providers::fetch_unified_images(tmdb_id, is_movie, &state).await;
    Ok(Json(images))
}
