// ══════════════════════════════════════════════════════════════
// artwork_providers.rs — Multi-provider image aggregator
// Providers: TMDB · Fanart.tv · TheTVDB · Simkl · Watchmode · OMDb
//
// Rules:
//   - Provider skipped if its ENV key is empty
//   - Calls grouped in 2 parallel stages (ext_ids needed for stage 2)
//   - Fanart > TMDB > TVDB > others (priority order in merge)
//   - Deduplication + limit per category
// ══════════════════════════════════════════════════════════════

use std::collections::HashSet;
use serde_json::Value;
use crate::models::{ContentType, UnifiedImages};
use crate::services::tmdb;
use crate::AppState;

// ── Limits per category ─────────────────────────────────────
const MAX_SCENES:  usize = 16;
const MAX_POSTERS: usize = 12;
const MAX_LOGOS:   usize =  8;
const MAX_BANNERS: usize =  8;
const MAX_SEASONS: usize = 16;

// ── External IDs (retrieved via TMDB) ────────────────────────
struct ExternalIds {
    imdb_id: Option<String>,
    tvdb_id: Option<i64>,
}

// ── Public entry point ───────────────────────────────────────
/// Aggregates images from all configured providers for a given content.
/// Never raises an error: a failing provider returns empty lists.
pub async fn fetch_unified_images(
    tmdb_id: i64,
    is_movie: bool,
    state: &AppState,
) -> UnifiedImages {
    // ── Stage 1: all calls requiring only tmdb_id ──
    let (tmdb_val, fanart_val, ext_ids, simkl_poster, watchmode_poster) = tokio::join!(
        p_tmdb(tmdb_id, is_movie, state),
        p_fanart(tmdb_id, is_movie, &state.http_client, &state.fanart_key),
        p_external_ids(tmdb_id, is_movie, &state.http_client, &state.tmdb_key),
        p_simkl(tmdb_id, is_movie, &state.http_client, &state.simkl_client_id),
        p_watchmode(tmdb_id, is_movie, &state.http_client, &state.watchmode_key),
    );

    // ── Stage 2: providers requiring imdb_id or tvdb_id ───────
    let (tvdb_val, omdb_poster) = tokio::join!(
        p_tvdb(ext_ids.tvdb_id, is_movie, &state.http_client, &state.tvdb_key),
        p_omdb(ext_ids.imdb_id.as_deref(), &state.http_client, &state.omdb_key),
    );

    // ── Accumulation by priority order ───────────────────────
    let mut scenes  = Vec::<String>::new();
    let mut posters = Vec::<String>::new();
    let mut logos   = Vec::<String>::new();
    let mut banners = Vec::<String>::new();
    let mut seasons = Vec::<String>::new();

    // 1. Fanart.tv (highest priority — HD images without text)
    urls_from_json(&fanart_val["backgrounds"], &mut scenes);
    urls_from_json(&fanart_val["posters"],     &mut posters);
    urls_from_json(&fanart_val["logos"],       &mut logos);
    urls_from_json(&fanart_val["banners"],     &mut banners);
    urls_from_json(&fanart_val["artworks"],    &mut banners); // clearart → banners
    if !is_movie { urls_from_json(&fanart_val["seasons"], &mut seasons); }

    // 2. TMDB (backdrops sorted by vote_average)
    urls_from_json(&tmdb_val["backdrops"], &mut scenes);
    urls_from_json(&tmdb_val["posters"],   &mut posters);
    urls_from_json(&tmdb_val["logos"],     &mut logos);

    // 3. TheTVDB (series only — tvdb_id required)
    urls_from_json(&tvdb_val["backgrounds"], &mut scenes);
    urls_from_json(&tvdb_val["posters"],     &mut posters);
    urls_from_json(&tvdb_val["banners"],     &mut banners);
    urls_from_json(&tvdb_val["seasons"],     &mut seasons);

    // 4. Simkl, Watchmode, OMDb → posters only (last fallback)
    push_url(&mut posters, simkl_poster);
    push_url(&mut posters, watchmode_poster);
    push_url(&mut posters, omdb_poster);

    UnifiedImages {
        scenes:  dedup_limit(scenes,  MAX_SCENES),
        posters: dedup_limit(posters, MAX_POSTERS),
        logos:   dedup_limit(logos,   MAX_LOGOS),
        banners: dedup_limit(banners, MAX_BANNERS),
        seasons: dedup_limit(seasons, MAX_SEASONS),
    }
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

fn urls_from_json(val: &Value, out: &mut Vec<String>) {
    let Some(arr) = val.as_array() else { return };
    for v in arr {
        if let Some(s) = v.as_str() { out.push(s.to_string()); }
    }
}

fn push_url(v: &mut Vec<String>, url: Option<String>) {
    if let Some(u) = url { if !u.is_empty() { v.push(u); } }
}

fn dedup_limit(v: Vec<String>, limit: usize) -> Vec<String> {
    let mut seen = HashSet::new();
    v.into_iter()
        .filter(|u| !u.is_empty() && seen.insert(u.clone()))
        .take(limit)
        .collect()
}

// ══════════════════════════════════════════════════════════════
// PROVIDERS
// ══════════════════════════════════════════════════════════════

// ── TMDB images ───────────────────────────────────────────────
async fn p_tmdb(tmdb_id: i64, is_movie: bool, state: &AppState) -> Value {
    if state.tmdb_key.is_empty() { return Value::Null; }
    let ct = if is_movie { ContentType::Movie } else { ContentType::Series };
    let id_str = tmdb_id.to_string();
    tmdb::fetch_tmdb_images(&id_str, &ct, state).await.unwrap_or_default()
}

// ── Fanart.tv ─────────────────────────────────────────────────
async fn p_fanart(
    tmdb_id: i64,
    is_movie: bool,
    client: &reqwest::Client,
    api_key: &str,
) -> Value {
    crate::services::fanart::fetch_images(tmdb_id, is_movie, api_key, client)
        .await
        .unwrap_or_default()
}

// ── TMDB external_ids (imdb_id, tvdb_id) ─────────────────────
async fn p_external_ids(
    tmdb_id: i64,
    is_movie: bool,
    client: &reqwest::Client,
    api_key: &str,
) -> ExternalIds {
    let none = ExternalIds { imdb_id: None, tvdb_id: None };
    if api_key.is_empty() { return none; }
    let kind = if is_movie { "movie" } else { "tv" };
    let url = format!("https://api.themoviedb.org/3/{kind}/{tmdb_id}/external_ids");
    let Ok(resp) = client.get(&url).query(&[("api_key", api_key)]).send().await else { return none; };
    let Ok(json): Result<Value, _> = resp.json().await else { return none; };
    ExternalIds {
        imdb_id: json["imdb_id"].as_str().map(String::from),
        tvdb_id: json["tvdb_id"].as_i64(),
    }
}

// ── TheTVDB v4 (series only) ───────────────────────────
// Artwork type: 1=Background · 2=Poster · 6=Banner · 7=Season Poster
async fn p_tvdb(
    tvdb_id: Option<i64>,
    is_movie: bool,
    client: &reqwest::Client,
    api_key: &str,
) -> Value {
    // TVDB artworks limited to series (movie ID mapping non-trivial)
    let Some(id) = tvdb_id else { return Value::Null; };
    if api_key.is_empty() || is_movie { return Value::Null; }

    // 1. Authentication → JWT token
    let Ok(tok_resp) = client
        .post("https://api4.thetvdb.com/v4/login")
        .json(&serde_json::json!({ "apikey": api_key }))
        .send()
        .await
    else { return Value::Null; };
    let Ok(tok_json): Result<Value, _> = tok_resp.json().await else { return Value::Null; };
    let Some(token) = tok_json["data"]["token"].as_str() else { return Value::Null; };
    let token = token.to_string(); // own the value before tok_json is dropped

    // 2. Series artworks
    let url = format!("https://api4.thetvdb.com/v4/series/{id}/artworks");
    let Ok(art_resp) = client.get(&url).bearer_auth(&token).send().await
        else { return Value::Null; };
    let Ok(art): Result<Value, _> = art_resp.json().await else { return Value::Null; };

    let mut backgrounds = Vec::<String>::new();
    let mut posters     = Vec::<String>::new();
    let mut banners_v   = Vec::<String>::new();
    let mut season_pst  = Vec::<String>::new();

    if let Some(arr) = art["data"].as_array() {
        for item in arr {
            let Some(img) = item["image"].as_str() else { continue };
            match item["type"].as_i64() {
                Some(1) => backgrounds.push(img.to_string()),
                Some(2) => posters.push(img.to_string()),
                Some(6) => banners_v.push(img.to_string()),
                Some(7) => season_pst.push(img.to_string()),
                _       => {}
            }
        }
    }

    serde_json::json!({
        "backgrounds": backgrounds,
        "posters":     posters,
        "banners":     banners_v,
        "seasons":     season_pst,
    })
}

// ── Simkl (poster par tmdb_id) ────────────────────────────────
async fn p_simkl(
    tmdb_id: i64,
    is_movie: bool,
    client: &reqwest::Client,
    client_id: &str,
) -> Option<String> {
    if client_id.is_empty() { return None; }
    let media = if is_movie { "movie" } else { "show" };
    let tmdb_str = tmdb_id.to_string();
    let Ok(resp) = client.get("https://api.simkl.com/search/id")
        .query(&[("client_id", client_id), ("tmdb", tmdb_str.as_str()), ("type", media)])
        .send().await else { return None; };
    let Ok(json): Result<Value, _> = resp.json().await else { return None; };
    let hash = json.as_array()?.first()?["poster"].as_str()?.to_string();
    if hash.is_empty() { return None; }
    // Format URL Simkl : https://simkl.in/posters/{hash}_m.jpg (medium quality)
    Some(format!("https://simkl.in/posters/{hash}_m.jpg"))
}

// ── Watchmode (2 sequential internal calls) ─────────────────
async fn p_watchmode(
    tmdb_id: i64,
    is_movie: bool,
    client: &reqwest::Client,
    api_key: &str,
) -> Option<String> {
    if api_key.is_empty() { return None; }
    let field = if is_movie { "tmdb_movie_id" } else { "tmdb_tv_id" };

    // 1. Search to get the Watchmode ID
    let Ok(resp) = client.get("https://api.watchmode.com/v1/search/")
        .query(&[("apiKey", api_key), ("search_field", field), ("search_value", &tmdb_id.to_string())])
        .send().await else { return None; };
    let Ok(json): Result<Value, _> = resp.json().await else { return None; };
    let wm_id = json["title_results"].as_array()?.first()?["id"].as_i64()?;

    // 2. Details → poster URL
    let details_url = format!("https://api.watchmode.com/v1/title/{wm_id}/details/");
    let Ok(det_resp) = client.get(&details_url).query(&[("apiKey", api_key)]).send().await else { return None; };
    let Ok(det): Result<Value, _> = det_resp.json().await else { return None; };
    let poster = det["poster"].as_str()?.to_string();
    if poster.is_empty() { return None; }
    Some(poster)
}

// ── OMDb (fallback poster via imdb_id) ────────────────────────
async fn p_omdb(
    imdb_id: Option<&str>,
    client: &reqwest::Client,
    api_key: &str,
) -> Option<String> {
    let id = imdb_id?;
    if api_key.is_empty() { return None; }
    let Ok(resp) = client.get("https://www.omdbapi.com/")
        .query(&[("apikey", api_key), ("i", id)])
        .send().await else { return None; };
    let Ok(json): Result<Value, _> = resp.json().await else { return None; };
    let poster = json["Poster"].as_str()?;
    if poster == "N/A" || poster.is_empty() { return None; }
    Some(poster.to_string())
}
