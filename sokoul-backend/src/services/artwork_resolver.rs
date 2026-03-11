// ══════════════════════════════════════════════════════════════
// artwork_resolver.rs — Artwork multi-source aggregator
//
// Resolves the single best URL per artwork slot from every
// configured provider and returns a compact ArtworkBundle:
//
//   poster   → fanart · tmdb · tvdb · topposters · cinematerial
//   logo     → fanart · tmdb
//   backdrop → fanart · tmdb
//   banner   → fanart · tvdb
//
// Rules:
//   • Each provider call fails independently — never blocks others.
//   • TVDB requires JWT auth; fetched fresh per request (cached 7 days at bundle level).
//   • Fanart.tv /v3/movies/{id} uses TMDB ID; /v3/tv/{id} uses TVDB ID.
//   • Cache TTL = 7 days (SQLite, JSON column).
//   • Always returns 200 with partial nulls — never 500.
//
// Frontend usage (comment only — not implemented here):
//   Card thumbnail   → poster.tmdb
//   Hero banner      → backdrop.fanart ?? backdrop.tmdb
//   Detail logo      → logo.fanart ?? logo.tmdb
//   Rated poster     → poster.topposters ?? poster.tmdb
// ══════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use std::time::{SystemTime, UNIX_EPOCH};
use crate::AppState;

const CACHE_TTL: i64 = 7 * 24 * 3600; // 7 days in seconds

// ── Bundle types ──────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct PosterBundle {
    pub fanart:       Option<String>,
    pub tmdb:         Option<String>,
    pub tvdb:         Option<String>,
    pub topposters:   Option<String>,
    pub cinematerial: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct LogoBundle {
    pub fanart: Option<String>,
    pub tmdb:   Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BackdropBundle {
    pub fanart: Option<String>,
    pub tmdb:   Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BannerBundle {
    pub fanart: Option<String>,
    pub tvdb:   Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct ArtworkBundle {
    pub poster:   PosterBundle,
    pub logo:     LogoBundle,
    pub backdrop: BackdropBundle,
    pub banner:   BannerBundle,
}

// ── Cache ─────────────────────────────────────────────────────

pub async fn get_cached(
    tmdb_id: &str,
    media_type: &str,
    db: &SqlitePool,
) -> Option<ArtworkBundle> {
    let now = now_secs();
    let (bundle_json, fetched_at): (String, i64) = sqlx::query_as(
        "SELECT bundle, fetched_at FROM artwork_cache WHERE tmdb_id = ? AND media_type = ?"
    )
    .bind(tmdb_id)
    .bind(media_type)
    .fetch_optional(db)
    .await
    .ok()
    .flatten()?;
    if fetched_at + CACHE_TTL < now {
        return None; // stale
    }
    serde_json::from_str(&bundle_json).ok()
}

pub async fn store_cached(
    tmdb_id: &str,
    media_type: &str,
    bundle: &ArtworkBundle,
    db: &SqlitePool,
) {
    let Ok(json) = serde_json::to_string(bundle) else { return };
    let now = now_secs();
    let _ = sqlx::query(
        "INSERT OR REPLACE INTO artwork_cache (tmdb_id, media_type, bundle, fetched_at) \
         VALUES (?, ?, ?, ?)"
    )
    .bind(tmdb_id)
    .bind(media_type)
    .bind(&json)
    .bind(now)
    .execute(db)
    .await;
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

// ── Main resolver ─────────────────────────────────────────────

pub async fn resolve(
    tmdb_id: i64,
    is_movie: bool,
    state: &AppState,
) -> ArtworkBundle {
    // Step 1: external IDs — imdb_id for CineMaterial, tvdb_id for Fanart TV + TVDB.
    let ext = fetch_external_ids(tmdb_id, is_movie, state).await;

    // Fanart.tv /v3/movies/{id} → TMDB ID; /v3/tv/{id} → TVDB ID.
    let fanart_id: Option<i64> = if is_movie { Some(tmdb_id) } else { ext.tvdb_id };

    // Top Posters — deterministic URL, no HTTP call needed.
    let topposters_url = build_top_posters_url(tmdb_id, is_movie, &state.top_posters_key);

    // Step 2: all external calls in parallel.
    let (fanart_val, tmdb_val, tvdb_val, cinematerial_poster) = tokio::join!(
        fetch_fanart(fanart_id, is_movie, state),
        fetch_tmdb_images(tmdb_id, is_movie, state),
        fetch_tvdb(ext.tvdb_id, is_movie, state),
        fetch_cinematerial(ext.imdb_id.as_deref(), state),
    );

    // ── Assemble ────────────────────────────────────────────────
    let fanart_poster_key   = if is_movie { "movieposter"    } else { "tvposter"      };
    let fanart_backdrop_key = if is_movie { "moviebackground"} else { "showbackground"};
    let fanart_banner_key   = if is_movie { "moviebanner"    } else { "tvbanner"      };

    ArtworkBundle {
        poster: PosterBundle {
            fanart:       first_url(&fanart_val[fanart_poster_key]),
            tmdb:         best_tmdb_image(&tmdb_val["posters"],   "w500"),
            tvdb:         first_of_str_arr(&tvdb_val["posters"]),
            topposters:   topposters_url,
            cinematerial: cinematerial_poster,
        },
        logo: LogoBundle {
            // Language-preferring selection: fr > en > first
            fanart: if is_movie {
                best_by_lang(&fanart_val["hdmovielogo"])
                    .or_else(|| best_by_lang(&fanart_val["movielogo"]))
                    .or_else(|| best_by_lang(&fanart_val["clearlogo"]))
            } else {
                best_by_lang(&fanart_val["hdtvlogo"])
                    .or_else(|| best_by_lang(&fanart_val["clearlogo"]))
                    .or_else(|| best_by_lang(&fanart_val["tvlogo"]))
            },
            tmdb: best_tmdb_image(&tmdb_val["logos"], "w500"),
        },
        backdrop: BackdropBundle {
            fanart: first_url(&fanart_val[fanart_backdrop_key]),
            tmdb:   best_tmdb_image(&tmdb_val["backdrops"], "w1280"),
        },
        banner: BannerBundle {
            fanart: first_url(&fanart_val[fanart_banner_key]),
            tvdb:   first_of_str_arr(&tvdb_val["banners"]),
        },
    }
}

// ── External IDs (TMDB /external_ids) ─────────────────────────

struct ExternalIds {
    imdb_id: Option<String>,
    tvdb_id: Option<i64>,
}

async fn fetch_external_ids(tmdb_id: i64, is_movie: bool, state: &AppState) -> ExternalIds {
    let none = ExternalIds { imdb_id: None, tvdb_id: None };
    if state.tmdb_key.is_empty() { return none; }
    let kind = if is_movie { "movie" } else { "tv" };
    let url = format!("https://api.themoviedb.org/3/{kind}/{tmdb_id}/external_ids");
    let Ok(resp) = state.http_client.get(&url).query(&[("api_key", &state.tmdb_key)]).send().await else { return none; };
    let Ok(json): Result<Value, _> = resp.json().await else { return none; };
    ExternalIds {
        imdb_id: json["imdb_id"].as_str().filter(|s| !s.is_empty()).map(String::from),
        tvdb_id: json["tvdb_id"].as_i64().filter(|&v| v > 0),
    }
}

// ── Fanart.tv ─────────────────────────────────────────────────

async fn fetch_fanart(fanart_id: Option<i64>, is_movie: bool, state: &AppState) -> Value {
    let Some(id) = fanart_id else { return Value::Null; };
    if state.fanart_key.is_empty() { return Value::Null; }
    let ft = if is_movie { "movies" } else { "tv" };
    let url = format!("https://webservice.fanart.tv/v3/{ft}/{id}");
    let Ok(resp) = state.http_client.get(&url).query(&[("api_key", &state.fanart_key)]).send().await else { return Value::Null; };
    if !resp.status().is_success() { return Value::Null; }
    resp.json::<Value>().await.unwrap_or(Value::Null)
}

// ── TMDB Images ───────────────────────────────────────────────

async fn fetch_tmdb_images(tmdb_id: i64, is_movie: bool, state: &AppState) -> Value {
    if state.tmdb_key.is_empty() { return Value::Null; }
    let kind = if is_movie { "movie" } else { "tv" };
    let url = format!("https://api.themoviedb.org/3/{kind}/{tmdb_id}/images");
    let Ok(resp) = state.http_client.get(&url).query(&[("api_key", &state.tmdb_key)]).send().await else { return Value::Null; };
    if !resp.status().is_success() { return Value::Null; }
    resp.json::<Value>().await.unwrap_or(Value::Null)
}

// ── TheTVDB v4 ────────────────────────────────────────────────

async fn fetch_tvdb(tvdb_id: Option<i64>, is_movie: bool, state: &AppState) -> Value {
    let Some(id) = tvdb_id else { return Value::Null; };
    if state.tvdb_key.is_empty() || is_movie { return Value::Null; }

    // JWT login
    let Ok(tok_resp) = state.http_client
        .post("https://api4.thetvdb.com/v4/login")
        .json(&json!({ "apikey": state.tvdb_key }))
        .send().await
    else { return Value::Null; };
    let Ok(tok_json): Result<Value, _> = tok_resp.json().await else { return Value::Null; };
    let Some(token) = tok_json["data"]["token"].as_str() else { return Value::Null; };
    let token = token.to_string();

    // Artworks
    let url = format!("https://api4.thetvdb.com/v4/series/{id}/artworks");
    let Ok(art_resp) = state.http_client.get(&url).bearer_auth(&token).send().await
    else { return Value::Null; };
    let Ok(art): Result<Value, _> = art_resp.json().await else { return Value::Null; };

    let mut posters = Vec::<String>::new();
    let mut banners = Vec::<String>::new();

    if let Some(arr) = art["data"].as_array() {
        for item in arr {
            let Some(img) = item["image"].as_str() else { continue };
            match item["type"].as_i64() {
                Some(2) => posters.push(img.to_string()), // poster
                Some(6) => banners.push(img.to_string()), // banner
                _       => {}
            }
        }
    }

    json!({ "posters": posters, "banners": banners })
}

// ── Top Posters ───────────────────────────────────────────────

fn build_top_posters_url(tmdb_id: i64, is_movie: bool, api_key: &str) -> Option<String> {
    if api_key.is_empty() { return None; }
    let ct = if is_movie { "movie" } else { "series" };
    Some(format!("https://api.top-streaming.stream/{api_key}/tmdb/poster/{ct}-{tmdb_id}.jpg"))
}

// ── CineMaterial ─────────────────────────────────────────────

async fn fetch_cinematerial(imdb_id: Option<&str>, state: &AppState) -> Option<String> {
    let id = imdb_id?;
    if state.cinematerial_key.is_empty() { return None; }
    let resp = state.http_client.get("https://api.cinematerial.com/")
        .query(&[("imdbid", id), ("apikey", state.cinematerial_key.as_str())])
        .send().await.ok()?;
    if !resp.status().is_success() { return None; }
    let json: Value = resp.json().await.ok()?;
    // CineMaterial returns an array of poster objects; first item has an "img" URL.
    json.as_array()?
        .first()?["img"]
        .as_str()
        .map(String::from)
}

// ── Helpers ───────────────────────────────────────────────────

/// First Fanart image URL from an array of `{url, lang, likes, id}` objects.
fn first_url(val: &Value) -> Option<String> {
    val.as_array()?
        .first()?["url"]
        .as_str()
        .map(String::from)
}

/// Language-preferring selection from Fanart image array: en > first.
fn best_by_lang(val: &Value) -> Option<String> {
    let arr = val.as_array()?;
    arr.iter().find(|i| i["lang"] == "en")
        .or_else(|| arr.first())
        .and_then(|i| i["url"].as_str())
        .map(String::from)
}

/// Best TMDB image by vote_average, returns fully-qualified URL.
fn best_tmdb_image(arr: &Value, size: &str) -> Option<String> {
    let items = arr.as_array()?;
    let best = items.iter().max_by(|a, b| {
        let va = a["vote_average"].as_f64().unwrap_or(0.0);
        let vb = b["vote_average"].as_f64().unwrap_or(0.0);
        va.partial_cmp(&vb).unwrap_or(std::cmp::Ordering::Equal)
    })?;
    let path = best["file_path"].as_str()?;
    Some(format!("https://image.tmdb.org/t/p/{size}{path}"))
}

/// First element from a plain string array (TVDB results).
fn first_of_str_arr(val: &Value) -> Option<String> {
    val.as_array()?
        .first()?
        .as_str()
        .map(String::from)
}
