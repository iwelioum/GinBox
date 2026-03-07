use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use std::time::{SystemTime, UNIX_EPOCH};

const LOGO_CACHE_TTL: i64 = 2_592_000; // 30 days

#[derive(Deserialize, Serialize, Clone)]
struct FanartImage {
    url: String,
    lang: String,
}

#[derive(Deserialize, Default)]
struct FanartApiResponse {
    // Logos (already present — do not remove)
    #[serde(default)] hdmovielogo:    Vec<FanartImage>,
    #[serde(default)] movielogo:      Vec<FanartImage>,
    #[serde(default)] hdtvlogo:       Vec<FanartImage>,
    #[serde(default)] tvlogo:         Vec<FanartImage>,

    // Backgrounds / Scenes
    #[serde(default)] moviebackground: Vec<FanartImage>,
    #[serde(default)] showbackground:  Vec<FanartImage>,

    // Posters alternatifs
    #[serde(default)] movieposter:    Vec<FanartImage>,
    #[serde(default)] tvposter:       Vec<FanartImage>,

    // Stylized artworks (background with characters)
    #[serde(default)] hdmovieclearart: Vec<FanartImage>,
    #[serde(default)] hdclearart:      Vec<FanartImage>,

    // Banners
    #[serde(default)] moviebanner:    Vec<FanartImage>,
    #[serde(default)] tvbanner:       Vec<FanartImage>,

    // Season posters (TV)
    #[serde(default)] seasonposter:   Vec<FanartImage>,
}

// Function that returns the raw Fanart.tv API response
pub async fn fetch_all_fanart_data(
    fanart_id: i64,  // TMDB ID for movies, TVDB ID for TV shows
    is_movie: bool,
    api_key: &str,
    http_client: &reqwest::Client,
) -> Result<Value, AppError> {
    let fanart_type = if is_movie { "movies" } else { "tv" };
    let url = format!(
        "https://webservice.fanart.tv/v3/{fanart_type}/{fanart_id}?api_key={api_key}"
    );

    let resp = http_client.get(&url).send().await?;

    if resp.status().is_success() {
        let data: Value = resp.json().await?;
        Ok(data)
    } else {
        // In case of error (e.g. 404), return null JSON to avoid breaking the client.
        Ok(Value::Null)
    }
}


fn select_best_logo(logos: &[FanartImage]) -> Option<String> {
    logos.iter().find(|l| l.lang == "fr")
        .or_else(|| logos.iter().find(|l| l.lang == "en"))
        .or_else(|| logos.first())
        .map(|l| l.url.clone())
}

pub async fn get_cached_logo(
    imdb_id: &str,
    db: &SqlitePool,
) -> Result<Option<String>, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::ConfigError(e.to_string()))?
        .as_secs() as i64;

    let row: Option<(String, i64)> = sqlx::query_as(
        "SELECT logo_url, cached_at FROM fanart_logos WHERE imdb_id = ?"
    )
    .bind(imdb_id)
    .fetch_optional(db)
    .await?;

    if let Some((logo_url, cached_at)) = row {
        if cached_at + LOGO_CACHE_TTL > now {
            return Ok(Some(logo_url));
        }
    }

    Ok(None)
}

async fn cache_logo(
    imdb_id: &str,
    logo_url: &str,
    db: &SqlitePool,
) -> Result<(), AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::ConfigError(e.to_string()))?
        .as_secs() as i64;

    sqlx::query(
        "INSERT OR REPLACE INTO fanart_logos (imdb_id, logo_url, cached_at) VALUES (?, ?, ?)"
    )
    .bind(imdb_id)
    .bind(logo_url)
    .bind(now)
    .execute(db)
    .await?;

    Ok(())
}

pub async fn fetch_and_cache_logo(
    imdb_id: &str,
    tmdb_id: i64,
    is_movie: bool,
    api_key: &str,
    http_client: &reqwest::Client,
    db: &SqlitePool,
) -> Result<Option<String>, AppError> {
    let fanart_type = if is_movie { "movies" } else { "tv" };
    let url = format!(
        "https://webservice.fanart.tv/v3/{fanart_type}/{tmdb_id}?api_key={api_key}"
    );

    let resp = http_client.get(&url).send().await?;

    let logo_url = if resp.status().is_success() {
        let data: FanartApiResponse = resp.json().await.unwrap_or_default();

        let mut logos: Vec<FanartImage> = if is_movie {
            let mut v = data.hdmovielogo;
            v.extend(data.movielogo);
            v
        } else {
            let mut v = data.hdtvlogo;
            v.extend(data.tvlogo);
            v
        };

        logos.sort_by(|a, b| {
            let la = a.lang.as_str();
            let lb = b.lang.as_str();
            let pa = if la == "fr" { 0 } else if la == "en" { 1 } else { 2 };
            let pb = if lb == "fr" { 0 } else if lb == "en" { 1 } else { 2 };
            pa.cmp(&pb)
        });

        select_best_logo(&logos)
    } else {
        None
    };

    cache_logo(imdb_id, logo_url.as_deref().unwrap_or(""), db).await?;

    Ok(logo_url)
}

pub async fn fetch_images(
    tmdb_id:     i64,
    is_movie:    bool,
    api_key:     &str,
    http_client: &reqwest::Client,
) -> Result<Value, AppError> {
    let fanart_type = if is_movie { "movies" } else { "tv" };
    let url = format!(
        "https://webservice.fanart.tv/v3/{fanart_type}/{tmdb_id}?api_key={api_key}"
    );

    let resp = http_client.get(&url).send().await?;

    if !resp.status().is_success() {
        return Ok(json!({
            "backgrounds": [],
            "posters":     [],
            "artworks":    [],
            "logos":       [],
            "banners":     [],
            "seasons":     []
        }));
    }

    let data: FanartApiResponse = resp.json().await.unwrap_or_default();

    // Backgrounds (scenes)
    let backgrounds: Vec<String> = if is_movie {
        data.moviebackground.iter().map(|i| i.url.clone()).collect()
    } else {
        data.showbackground.iter().map(|i| i.url.clone()).collect()
    };

    // Alternative posters
    let posters: Vec<String> = if is_movie {
        data.movieposter.iter().map(|i| i.url.clone()).collect()
    } else {
        data.tvposter.iter().map(|i| i.url.clone()).collect()
    };

    // Artworks (clearart)
    let artworks: Vec<String> = if is_movie {
        data.hdmovieclearart.iter().map(|i| i.url.clone()).collect()
    } else {
        data.hdclearart.iter().map(|i| i.url.clone()).collect()
    };

    // Logos
    let logos: Vec<String> = if is_movie {
        let mut v: Vec<String> = data.hdmovielogo.iter().map(|i| i.url.clone()).collect();
        v.extend(data.movielogo.iter().map(|i| i.url.clone()));
        v
    } else {
        let mut v: Vec<String> = data.hdtvlogo.iter().map(|i| i.url.clone()).collect();
        v.extend(data.tvlogo.iter().map(|i| i.url.clone()));
        v
    };

    // Banners
    let banners: Vec<String> = if is_movie {
        data.moviebanner.iter().map(|i| i.url.clone()).collect()
    } else {
        data.tvbanner.iter().map(|i| i.url.clone()).collect()
    };

    // Season posters (TV only)
    let seasons: Vec<String> = if !is_movie {
        data.seasonposter.iter().map(|i| i.url.clone()).collect()
    } else {
        vec![]
    };

    Ok(json!({
        "backgrounds": backgrounds,
        "posters":     posters,
        "artworks":    artworks,
        "logos":       logos,
        "banners":     banners,
        "seasons":     seasons
    }))
}
