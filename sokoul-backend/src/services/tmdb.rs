use crate::errors::AppError;
use crate::models::{Catalog, CatalogItem, ContentType, Meta, Video};
use crate::AppState;
use serde::Deserialize;
use std::collections::HashMap;

const TMDB_BASE_URL: &str = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE: &str = "https://image.tmdb.org/t/p/w500";
const TMDB_LANGUAGE: &str = "fr-FR";
#[allow(dead_code)]
pub const TMDB_CACHE_TTL_SECS: u64 = 604_800;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
struct TmdbMovie {
    id: u32,
    imdb_id: Option<String>,
    title: String,
    overview: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    release_date: Option<String>,
    #[serde(default)]
    genres: Vec<TmdbGenre>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
struct TmdbShow {
    id: u32,
    name: String,
    overview: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    first_air_date: Option<String>,
    #[serde(default)]
    genres: Vec<TmdbGenre>,
    #[serde(default)]
    episode_run_time: Vec<u32>,
    #[serde(default)]
    seasons: Vec<TmdbSeason>,
    external_ids: Option<TmdbExternalIds>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
struct TmdbSeason {
    season_number: u32,
    #[serde(default)]
    episode_count: u32,
    name: Option<String>,
    #[serde(default)]
    episodes: Option<Vec<TmdbEpisode>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
struct TmdbEpisode {
    episode_number: u32,
    name: Option<String>,
    overview: Option<String>,
    still_path: Option<String>,
    air_date: Option<String>,
    runtime: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct TmdbExternalIds {
    imdb_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TmdbGenre {
    name: String,
}

async fn fetch_tmdb_season_details(
    client: &reqwest::Client,
    tmdb_key: &str,
    tmdb_id: u32,
    season_number: u32,
    language: &str,
) -> Option<TmdbSeason> {
    let season_url = format!("{}/tv/{}/season/{}", TMDB_BASE_URL, tmdb_id, season_number);
    let response = client
        .get(&season_url)
        .query(&[
            ("api_key", tmdb_key),
            ("language", language),
        ])
        .send()
        .await
        .ok()?;

    if !response.status().is_success() {
        return None;
    }

    response.json::<TmdbSeason>().await.ok()
}

fn has_missing_episode_fields(season: &TmdbSeason) -> bool {
    let Some(episodes) = season.episodes.as_ref() else {
        return true;
    };
    episodes.iter().any(|episode| {
        episode.name.as_deref().map(str::trim).map(str::is_empty).unwrap_or(true)
            || episode.overview.as_deref().map(str::trim).map(str::is_empty).unwrap_or(true)
            || episode.still_path.is_none()
            || episode.runtime.is_none()
    })
}

fn merge_season_fallback(primary: &mut TmdbSeason, fallback: TmdbSeason) {
    if primary.name.is_none() {
        primary.name = fallback.name;
    }
    if primary.episode_count == 0 {
        primary.episode_count = fallback.episode_count;
    }

    match (&mut primary.episodes, fallback.episodes) {
        (Some(primary_eps), Some(fallback_eps)) => {
            let mut fallback_by_episode: HashMap<u32, TmdbEpisode> = fallback_eps
                .into_iter()
                .map(|episode| (episode.episode_number, episode))
                .collect();

            for primary_ep in primary_eps.iter_mut() {
                let Some(mut fallback_ep) = fallback_by_episode.remove(&primary_ep.episode_number) else {
                    continue;
                };

                if primary_ep.name.as_deref().map(str::trim).map(str::is_empty).unwrap_or(true) {
                    primary_ep.name = fallback_ep.name.take();
                }
                if primary_ep.overview.as_deref().map(str::trim).map(str::is_empty).unwrap_or(true) {
                    primary_ep.overview = fallback_ep.overview.take();
                }
                if primary_ep.still_path.is_none() {
                    primary_ep.still_path = fallback_ep.still_path.take();
                }
                if primary_ep.air_date.is_none() {
                    primary_ep.air_date = fallback_ep.air_date.take();
                }
                if primary_ep.runtime.is_none() {
                    primary_ep.runtime = fallback_ep.runtime;
                }
            }

            for (_, fallback_ep) in fallback_by_episode {
                primary_eps.push(fallback_ep);
            }
            primary_eps.sort_by_key(|episode| episode.episode_number);
        }
        (None, Some(fallback_eps)) => {
            primary.episodes = Some(fallback_eps);
        }
        _ => {}
    }
}

/// Converts a TMDB genre_id to a French genre name.
/// Note: Genre names are intentionally kept in French as they are data values displayed in the UI.
fn tmdb_genre_name(id: u32) -> Option<&'static str> {
    match id {
        // Movies
        28    => Some("Action"),
        12    => Some("Aventure"),
        16    => Some("Animation"),
        35    => Some("Comédie"),
        80    => Some("Crime"),
        99    => Some("Documentaire"),
        18    => Some("Drame"),
        10751 => Some("Famille"),
        14    => Some("Fantaisie"),
        36    => Some("Histoire"),
        27    => Some("Horreur"),
        10402 => Some("Musique"),
        9648  => Some("Mystère"),
        10749 => Some("Romance"),
        878   => Some("Science-Fiction"),
        10770 => Some("Téléfilm"),
        53    => Some("Thriller"),
        10752 => Some("Guerre"),
        37    => Some("Western"),
        // Series (TV only)
        10759 => Some("Action & Aventure"),
        10762 => Some("Enfants"),
        10763 => Some("Actualités"),
        10764 => Some("Télé-réalité"),
        10765 => Some("Sci-Fi & Fantaisie"),
        10766 => Some("Soap"),
        10767 => Some("Talk Show"),
        10768 => Some("Guerre & Politique"),
        _     => None,
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
struct TmdbListItem {
    id: u32,
    title: Option<String>,
    name: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    release_date: Option<String>,
    first_air_date: Option<String>,
    #[serde(default)]
    vote_average: Option<f32>,
    original_language: Option<String>,
    #[serde(default)]
    origin_country: Vec<String>,
    #[serde(default)]
    genre_ids: Vec<u32>,
    #[serde(default)]
    vote_count: Option<u32>,
    #[serde(default)]
    popularity: Option<f32>,
}

#[derive(Debug, Deserialize)]
struct TmdbListResponse {
    results: Vec<TmdbListItem>,
}

#[derive(Debug, Deserialize)]
struct TmdbFindResponse {
    movie_results: Vec<TmdbListItem>,
    tv_results: Vec<TmdbListItem>,
}

fn normalize_list_item(item: TmdbListItem, content_type: &ContentType) -> CatalogItem {
    let name = match content_type {
        ContentType::Movie => item.title.unwrap_or_default(),
        ContentType::Series => item.name.unwrap_or_default(),
    };
    let release_info = item.release_date.or(item.first_air_date).and_then(|d| d.split('-').next().map(String::from));
    let genres = if item.genre_ids.is_empty() {
        None
    } else {
        let names: Vec<String> = item.genre_ids.iter()
            .filter_map(|&id| tmdb_genre_name(id).map(String::from))
            .collect();
        if names.is_empty() { None } else { Some(names) }
    };
    CatalogItem {
        id: format!("tmdb:{}", item.id),
        content_type: content_type.clone(),
        name,
        poster: item.poster_path.map(|p| format!("{}{}", TMDB_IMAGE_BASE, p)),
        // backdrop_path stored as raw path (e.g. /abc.jpg) so the
        // frontend can request /original/ quality via toImgUrl()
        backdrop_path: item.backdrop_path,
        release_info,
        genres,
        imdb_rating: None,
        vote_average: item.vote_average.filter(|&v| v > 0.0),
        original_language: item.original_language,
        origin_country: item.origin_country,
        vote_count: item.vote_count,
        popularity: item.popularity.filter(|&v| v > 0.0),
    }
}

fn normalize_movie(movie: TmdbMovie) -> Meta {
    Meta {
        id: movie.imdb_id.unwrap_or_else(|| format!("tmdb:{}", movie.id)),
        content_type: ContentType::Movie,
        name: movie.title,
        poster: movie.poster_path.map(|p| format!("{}{}", TMDB_IMAGE_BASE, p)),
        background: movie.backdrop_path.map(|p| format!("{}{}", TMDB_IMAGE_BASE, p)),
        description: movie.overview,
        year: movie.release_date.and_then(|d| d.split('-').next().and_then(|y| y.parse().ok())),
        genres: Some(movie.genres.into_iter().map(|g| g.name).collect()),
        videos: None,
    }
}

fn normalize_show(show: TmdbShow) -> Meta {
    let TmdbShow {
        id,
        name,
        overview,
        poster_path,
        backdrop_path,
        first_air_date,
        genres,
        episode_run_time,
        seasons,
        external_ids,
    } = show;

    let imdb_id = external_ids
        .and_then(|ext| ext.imdb_id)
        .unwrap_or_else(|| format!("tmdb:{}", id));
    let default_episode_runtime = episode_run_time.first().copied();

    let mut videos: Vec<Video> = Vec::new();
    for season in seasons.into_iter().filter(|s| s.season_number > 0) {
        let season_number = season.season_number;

        if let Some(episodes) = season.episodes {
            for ep in episodes.into_iter().filter(|e| e.episode_number > 0) {
                let episode_number = ep.episode_number;
                videos.push(Video {
                    id: format!("{}:{}:{}", imdb_id, season_number, episode_number),
                    title: ep.name,
                    season: Some(season_number),
                    episode: Some(episode_number),
                    released: ep.air_date,
                    overview: ep.overview,
                    still_path: ep.still_path,
                    runtime: ep.runtime.or(default_episode_runtime),
                });
            }
            continue;
        }

        // Season has episode_count but no episode details — skip instead of fabricating
        // The frontend will fetch season details separately via /catalog/meta/:type/:id
        tracing::debug!(
            "Season {} of {} has {} episodes but no details — skipping placeholders",
            season_number, imdb_id, season.episode_count
        );
    }

    Meta {
        id: imdb_id.clone(),
        content_type: ContentType::Series,
        name,
        poster: poster_path.map(|p| format!("{}{}", TMDB_IMAGE_BASE, p)),
        background: backdrop_path.map(|p| format!("{}{}", TMDB_IMAGE_BASE, p)),
        description: overview,
        year: first_air_date.and_then(|d| d.split('-').next().and_then(|y| y.parse().ok())),
        genres: Some(genres.into_iter().map(|g| g.name).collect()),
        videos: if videos.is_empty() { None } else { Some(videos) },
    }
}

pub async fn fetch_top_rated_catalog(content_type: &ContentType, page: u32, state: &AppState) -> Result<Catalog, AppError> {
    let path = match content_type { ContentType::Movie => "movie/top_rated", ContentType::Series => "tv/top_rated" };
    let url = format!("{}/{}", TMDB_BASE_URL, path);
    let response = state.http_client.get(url)
        .query(&[("api_key", &state.tmdb_key), ("language", &TMDB_LANGUAGE.to_string()), ("page", &page.to_string())])
        .send().await.map_err(|e| AppError::NetworkError(format!("TMDB top_rated fetch failed: {}", e)))?;
    let list_response = response.json::<TmdbListResponse>().await.map_err(|e| AppError::ParseError(format!("TMDB top_rated parse failed: {}", e)))?;
    let metas = list_response.results.into_iter().map(|item| normalize_list_item(item, content_type)).collect();
    Ok(Catalog { metas, has_more: Some(true) })
}

pub async fn fetch_popular_catalog(content_type: &ContentType, page: u32, state: &AppState) -> Result<Catalog, AppError> {
    let path = match content_type { ContentType::Movie => "movie/popular", ContentType::Series => "tv/popular" };
    let url = format!("{}/{}", TMDB_BASE_URL, path);
    let response = state.http_client.get(url)
        .query(&[("api_key", &state.tmdb_key), ("language", &TMDB_LANGUAGE.to_string()), ("page", &page.to_string())])
        .send().await.map_err(|e| AppError::NetworkError(format!("TMDB popular fetch failed: {}", e)))?;
    let list_response = response.json::<TmdbListResponse>().await.map_err(|e| AppError::ParseError(format!("TMDB popular parse failed: {}", e)))?;
    let metas = list_response.results.into_iter().map(|item| normalize_list_item(item, content_type)).collect();
    Ok(Catalog { metas, has_more: Some(true) })
}

pub async fn fetch_genre_catalog(genre_id: u32, content_type: &ContentType, page: u32, state: &AppState) -> Result<Catalog, AppError> {
    fetch_discover_catalog(content_type, page, state,
        Some(&genre_id.to_string()), None, None, None, None).await
}

/// Unified TMDB /discover endpoint supporting genre, language, keyword, year filters
#[allow(clippy::too_many_arguments)]
pub async fn fetch_discover_catalog(
    content_type: &ContentType,
    page: u32,
    state: &AppState,
    genres: Option<&str>,
    language: Option<&str>,
    keyword: Option<&str>,
    year_gte: Option<&str>,
    year_lte: Option<&str>,
) -> Result<Catalog, AppError> {
    let path = match content_type { ContentType::Movie => "discover/movie", ContentType::Series => "discover/tv" };
    let url = format!("{}/{}", TMDB_BASE_URL, path);

    let mut params: Vec<(&str, String)> = vec![
        ("api_key",  state.tmdb_key.clone()),
        ("language", TMDB_LANGUAGE.to_string()),
        ("page",     page.to_string()),
        ("sort_by",  "popularity.desc".to_string()),
    ];

    if let Some(g) = genres {
        params.push(("with_genres", g.to_string()));
    }
    if let Some(lang) = language {
        params.push(("with_original_language", lang.to_string()));
    }
    if let Some(kw) = keyword {
        params.push(("with_keywords", kw.to_string()));
    }
    // Date filters use different param names for movie vs TV
    if let Some(gte) = year_gte {
        let param_name = match content_type {
            ContentType::Movie => "primary_release_date.gte",
            ContentType::Series => "first_air_date.gte",
        };
        params.push((param_name, format!("{}-01-01", gte)));
    }
    if let Some(lte) = year_lte {
        let param_name = match content_type {
            ContentType::Movie => "primary_release_date.lte",
            ContentType::Series => "first_air_date.lte",
        };
        params.push((param_name, format!("{}-12-31", lte)));
    }

    let response = state.http_client.get(url)
        .query(&params)
        .send().await.map_err(|e| AppError::NetworkError(format!("TMDB discover fetch failed: {}", e)))?;
    let list_response = response.json::<TmdbListResponse>().await.map_err(|e| AppError::ParseError(format!("TMDB discover parse failed: {}", e)))?;
    let metas = list_response.results.into_iter().map(|item| normalize_list_item(item, content_type)).collect();
    Ok(Catalog { metas, has_more: Some(true) })
}

pub async fn search_catalog(query: &str, content_type: &ContentType, state: &AppState) -> Result<Catalog, AppError> {
    let path = match content_type { ContentType::Movie => "search/movie", ContentType::Series => "search/tv" };
    let url = format!("{}/{}", TMDB_BASE_URL, path);
    let response = state.http_client.get(url)
        .query(&[("api_key", &state.tmdb_key), ("language", &TMDB_LANGUAGE.to_string()), ("query", &query.to_string())])
        .send().await.map_err(|e| AppError::NetworkError(format!("TMDB search failed: {}", e)))?;
    let list_response = response.json::<TmdbListResponse>().await.map_err(|e| AppError::ParseError(format!("TMDB search parse failed: {}", e)))?;
    let metas = list_response.results.into_iter().map(|item| normalize_list_item(item, content_type)).collect();
    Ok(Catalog { metas, has_more: Some(false) })
}

pub async fn fetch_meta(id: &str, content_type: &ContentType, state: &AppState) -> Result<Meta, AppError> {
    let tmdb_id = if id.starts_with("tt") {
        let find_url = format!("{}/find/{}", TMDB_BASE_URL, id);
        let find_response = state.http_client.get(find_url)
            .query(&[("api_key", &state.tmdb_key), ("language", &TMDB_LANGUAGE.to_string()), ("external_source", &"imdb_id".to_string())])
            .send().await.map_err(|e| AppError::NetworkError(format!("TMDB find failed: {}", e)))?
            .json::<TmdbFindResponse>().await.map_err(|e| AppError::ParseError(format!("TMDB find parse failed: {}", e)))?;
        let results = match content_type {
            ContentType::Movie => find_response.movie_results, ContentType::Series => find_response.tv_results,
        };
        results.first().map(|item| item.id).ok_or_else(|| AppError::NotFound(format!("ID {} not found in TMDB for type {:?}", id, content_type)))?
    } else if let Some(tmdb_id_str) = id.strip_prefix("tmdb:") {
        tmdb_id_str.parse::<u32>().map_err(|_| AppError::NotFound("Invalid tmdb: ID format".into()))?
    } else {
        return Err(AppError::NotFound("Invalid ID format for TMDB lookup".into()));
    };

    let path = match content_type { ContentType::Movie => format!("movie/{}", tmdb_id), ContentType::Series => format!("tv/{}", tmdb_id) };
    let url = format!("{}/{}", TMDB_BASE_URL, path);
    let request = state.http_client.get(url)
        .query(&[("api_key", &state.tmdb_key), ("language", &TMDB_LANGUAGE.to_string()), ("append_to_response", &"external_ids,seasons".to_string())]);

    match content_type {
        ContentType::Movie => {
            let movie = request.send().await.map_err(|e| AppError::NetworkError(e.to_string()))?.json::<TmdbMovie>().await.map_err(|e| AppError::ParseError(e.to_string()))?;
            Ok(normalize_movie(movie))
        }
        ContentType::Series => {
            let mut show = request
                .send()
                .await
                .map_err(|e| AppError::NetworkError(e.to_string()))?
                .json::<TmdbShow>()
                .await
                .map_err(|e| AppError::ParseError(e.to_string()))?;

            let season_numbers: Vec<u32> = show
                .seasons
                .iter()
                .filter(|s| s.season_number > 0)
                .map(|s| s.season_number)
                .collect();

            let mut season_tasks = Vec::new();
            for season_number in season_numbers {
                let client = state.http_client.clone();
                let tmdb_key = state.tmdb_key.clone();
                season_tasks.push(tokio::spawn(async move {
                    let mut details = fetch_tmdb_season_details(
                        &client,
                        tmdb_key.as_str(),
                        tmdb_id,
                        season_number,
                        TMDB_LANGUAGE,
                    )
                    .await?;

                    if has_missing_episode_fields(&details) {
                        if let Some(fallback_details) = fetch_tmdb_season_details(
                            &client,
                            tmdb_key.as_str(),
                            tmdb_id,
                            season_number,
                            "en-US",
                        )
                        .await
                        {
                            merge_season_fallback(&mut details, fallback_details);
                        }
                    }

                    Some((season_number, details))
                }));
            }

            let mut season_details: HashMap<u32, TmdbSeason> = HashMap::new();
            for task in season_tasks {
                if let Ok(Some((season_number, details))) = task.await {
                    season_details.insert(season_number, details);
                }
            }

            for season in show.seasons.iter_mut().filter(|s| s.season_number > 0) {
                let Some(details) = season_details.remove(&season.season_number) else {
                    continue;
                };
                if let Some(episodes) = details.episodes {
                    if !episodes.is_empty() {
                        season.episodes = Some(episodes);
                    }
                }
                if details.name.is_some() {
                    season.name = details.name;
                }
                if details.episode_count > 0 {
                    season.episode_count = details.episode_count;
                }
            }

            Ok(normalize_show(show))
        }
    }
}

pub async fn resolve_title_for_prowlarr(id: &str, content_type: &ContentType, state: &AppState) -> Result<String, AppError> {
    // For "tmdb:XXXXX" IDs, keep the full prefix (do not split on ':').
    // For episodic IDs "tt1234567:1:1", extract only the base ID.
    let base_id = if id.starts_with("tmdb:") {
        id
    } else {
        id.split(':').next().unwrap_or(id)
    };

    if let Ok(Some(meta)) = super::cache::get_cached_meta(base_id, &state.db).await {
        return Ok(format_title_with_optional_year(&meta.name, meta.year));
    }
    let meta = fetch_meta(base_id, content_type, state).await?;
    super::cache::cache_meta(&meta, &state.db).await?;
    Ok(format_title_with_optional_year(&meta.name, meta.year))
}

fn format_title_with_optional_year(title: &str, year: Option<u32>) -> String {
    match year {
        Some(y) if y > 1900 => format!("{title} {y}"),
        _ => title.to_string(),
    }
}

/// Resolves an ID (tmdb: or imdb tt...) to an IMDB ID if available.
/// Used by Torrentio which only accepts IMDB IDs.
/// Caches the result to avoid duplicate TMDB calls.
pub async fn resolve_to_imdb_id(
    id: &str,
    content_type: &ContentType,
    state: &AppState,
) -> Option<String> {
    if id.starts_with("tt") {
        // Already an IMDB ID — extract the base part (without season/episode)
        return Some(id.split(':').next().unwrap_or(id).to_string());
    }
    // Check DB cache first
    if let Ok(Some(meta)) = super::cache::get_cached_meta(id, &state.db).await {
        if meta.id.starts_with("tt") {
            return Some(meta.id);
        }
    }
    // For tmdb:XXXXX → call TMDB to get imdb_id from movie details
    match fetch_meta(id, content_type, state).await {
        Ok(meta) => {
            // Cache to avoid a second call in resolve_title_for_prowlarr
            let _ = super::cache::cache_meta(&meta, &state.db).await;
            if meta.id.starts_with("tt") { Some(meta.id) } else { None }
        }
        Err(_) => None,
    }
}

// ── Internal structs for TMDB credits ───────────────────────────────────
#[derive(Debug, Deserialize)]
struct TmdbCastEntry {
    id: u32,
    name: String,
    character: Option<String>,
    profile_path: Option<String>,
    order: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct TmdbCreditsResponse {
    cast: Vec<TmdbCastEntry>,
}

// Resolves any ID format to a numeric TMDB ID (reuses fetch_meta logic)
async fn resolve_tmdb_numeric_id(
    id: &str,
    content_type: &ContentType,
    state: &AppState,
) -> Result<u32, AppError> {
    if id.starts_with("tt") {
        let find_url = format!("{}/find/{}", TMDB_BASE_URL, id);
        let resp = state.http_client.get(find_url)
            .query(&[
                ("api_key", state.tmdb_key.as_str()),
                ("language", TMDB_LANGUAGE),
                ("external_source", "imdb_id"),
            ])
            .send().await.map_err(|e| AppError::NetworkError(e.to_string()))?
            .json::<TmdbFindResponse>().await.map_err(|e| AppError::ParseError(e.to_string()))?;
        let results = match content_type {
            ContentType::Movie  => resp.movie_results,
            ContentType::Series => resp.tv_results,
        };
        results.first().map(|item| item.id)
            .ok_or_else(|| AppError::NotFound(format!("ID {} not found in TMDB", id)))
    } else if let Some(s) = id.strip_prefix("tmdb:") {
        s.parse::<u32>().map_err(|_| AppError::NotFound("Invalid tmdb: format".into()))
    } else {
        id.parse::<u32>().map_err(|_| AppError::NotFound("Invalid ID format".into()))
    }
}

/// Retrieves the cast (20 main actors) for a movie or series.
pub async fn fetch_credits(
    id: &str,
    content_type: &ContentType,
    state: &AppState,
) -> Result<crate::models::Credits, AppError> {
    let tmdb_id = resolve_tmdb_numeric_id(id, content_type, state).await?;

    let path = match content_type {
        ContentType::Movie  => format!("movie/{}/credits", tmdb_id),
        ContentType::Series => format!("tv/{}/credits",    tmdb_id),
    };
    let url = format!("{}/{}", TMDB_BASE_URL, path);

    let resp = state.http_client.get(&url)
        .query(&[("api_key", state.tmdb_key.as_str()), ("language", TMDB_LANGUAGE)])
        .send().await.map_err(|e| AppError::NetworkError(e.to_string()))?
        .json::<TmdbCreditsResponse>().await.map_err(|e| AppError::ParseError(e.to_string()))?;

    const TMDB_PROFILE_BASE: &str = "https://image.tmdb.org/t/p/w185";

    let cast = resp.cast.into_iter()
        .take(20)
        .map(|m| crate::models::CastMember {
            id:           m.id,
            name:         m.name,
            character:    m.character,
            profile_path: m.profile_path.map(|p| format!("{}{}", TMDB_PROFILE_BASE, p)),
            order:        m.order.unwrap_or(0),
        })
        .collect();

    Ok(crate::models::Credits { cast })
}

// ── Structs for actor filmography ─────────────────────────────────
#[derive(Debug, Deserialize)]
struct TmdbPersonCredits {
    cast: Vec<TmdbPersonCastItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
struct TmdbPersonCastItem {
    id: u32,
    title: Option<String>,
    name: Option<String>,
    poster_path: Option<String>,
    release_date: Option<String>,
    first_air_date: Option<String>,
    media_type: Option<String>,
}

/// Retrieves the filmography of an actor (movies + series) by their TMDB person ID.
pub async fn fetch_person_movies(
    person_id: &str,
    state: &AppState,
) -> Result<Vec<crate::models::CatalogItem>, AppError> {
    let url = format!("{}/person/{}/combined_credits", TMDB_BASE_URL, person_id);
    let resp = state.http_client.get(&url)
        .query(&[("api_key", state.tmdb_key.as_str()), ("language", TMDB_LANGUAGE)])
        .send().await.map_err(|e| AppError::NetworkError(e.to_string()))?
        .json::<TmdbPersonCredits>().await.map_err(|e| AppError::ParseError(e.to_string()))?;

    let items = resp.cast.into_iter()
        .take(30)
        .map(|item| {
            let is_series = item.media_type.as_deref() == Some("tv");
            let content_type = if is_series { ContentType::Series } else { ContentType::Movie };
            let name = item.title.or(item.name).unwrap_or_default();
            let release_info = item.release_date.or(item.first_air_date)
                .and_then(|d| d.split('-').next().map(String::from));
            crate::models::CatalogItem {
                id: format!("tmdb:{}", item.id),
                content_type,
                name,
                poster: item.poster_path.map(|p| format!("{}{}", TMDB_IMAGE_BASE, p)),
                backdrop_path: None, // TmdbPersonCastItem n'a pas de backdrop
                release_info,
                genres: None,
                imdb_rating: None,
                vote_average: None,
                original_language: None,
                origin_country: vec![],
                vote_count: None,
                popularity: None,
            }
        })
        .collect();

    Ok(items)
}

pub async fn fetch_tmdb_images(
    id:           &str,
    content_type: &ContentType,
    state:        &AppState,
) -> Result<serde_json::Value, AppError> {
    let kind = match content_type {
        ContentType::Movie  => "movie",
        ContentType::Series => "tv",
    };

    let url = format!(
        "https://api.themoviedb.org/3/{kind}/{id}/images?api_key={}&include_image_language=fr,en,es,de,it,pt,ru,ja,zh,null",
        state.tmdb_key
    );

    let resp = state.http_client.get(&url).send().await.map_err(|e| AppError::NetworkError(e.to_string()))?;

    if !resp.status().is_success() {
        return Ok(serde_json::json!({
            "backdrops": [],
            "posters":   [],
            "logos":     []
        }));
    }

    // TMDB returns { backdrops: [{file_path, vote_average}], posters: [...], logos: [...] }
    // We extract only file_path, sorted by vote_average desc

    #[derive(Deserialize)]
    struct TmdbImageItem {
        file_path:     String,
        #[serde(default)]
        vote_average:  f64,
    }

    #[derive(Deserialize, Default)]
    struct TmdbImagesResponse {
        #[serde(default)] backdrops: Vec<TmdbImageItem>,
        #[serde(default)] posters:   Vec<TmdbImageItem>,
        #[serde(default)] logos:     Vec<TmdbImageItem>,
    }

    let mut data: TmdbImagesResponse = resp.json().await.unwrap_or_default();

    // Sort by quality (vote_average desc)
    data.backdrops.sort_by(|a, b| b.vote_average.partial_cmp(&a.vote_average).unwrap_or(std::cmp::Ordering::Equal));
    data.posters.sort_by(  |a, b| b.vote_average.partial_cmp(&a.vote_average).unwrap_or(std::cmp::Ordering::Equal));

    let base = "https://image.tmdb.org/t/p/original";

    Ok(serde_json::json!({
        "backdrops": data.backdrops.iter().take(40).map(|i| format!("{base}{}", i.file_path)).collect::<Vec<_>>(),
        "posters":   data.posters.iter().take(40).map(|i| format!("{base}{}", i.file_path)).collect::<Vec<_>>(),
        "logos":     data.logos.iter().take(15).map(|i| format!("{base}{}", i.file_path)).collect::<Vec<_>>(),
    }))
}

// ── Collections / Sagas ─────────────────────────────────────────────────────

/// ~120 popular TMDB collection IDs (major franchises)
pub const POPULAR_COLLECTION_IDS: &[u32] = &[
    // Superhero / Marvel / DC
    529892, // MCU
    131295, // Spider-Man (MCU)
    531241, // Spider-Man (Raimi)
    573436, // Spider-Verse
    263,    // The Dark Knight
    748,    // X-Men
    9485,   // Fast & Furious
    86311,  // Avengers
    422834, // Guardians of the Galaxy
    618529, // DC Extended Universe
    // Action Classics
    2344,   // Matrix
    528,    // Terminator
    399,    // Die Hard
    404609, // John Wick
    5039,   // Mission Impossible
    645,    // James Bond
    573693, // The Expendables
    87096,  // Transformers
    5547,   // Bourne
    295130, // Kingsman
    256322, // Equalizer
    735325, // Top Gun
    // Sci-Fi
    10,     // Star Wars
    8091,   // Alien
    115762, // Jurassic World
    328,    // Jurassic Park
    952069, // Planet of the Apes (Reboot)
    135416, // Hunger Games
    264,    // Back to the Future
    86066,  // Despicable Me
    1241,   // Harry Potter
    435259, // Fantastic Beasts
    121938, // Hobbit
    119,    // Lord of the Rings
    420,    // Chronicles of Narnia
    1709,   // Pirates of the Caribbean
    2150,   // Shrek
    87359,  // Mission: Impossible (Fallout era)
    // Horror
    2980,   // Halloween
    656,    // SAW
    2467,   // Conjuring
    468552, // IT
    8581,   // A Nightmare on Elm Street
    1733,   // Scream
    748401, // Insidious
    386382, // Annabelle
    91697,  // Purge
    519,    // Friday the 13th
    // Animation Pixar/Disney
    10194,  // Toy Story
    87118,  // Cars
    33085,  // Incredibles
    137697, // Finding Nemo/Dory
    284,    // Ice Age
    445,    // Madagascar
    125574, // Frozen
    748006, // Minions
    1582,   // Monster Inc
    497,    // Kung Fu Panda
    72419,  // How to Train Your Dragon
    386534, // Hotel Transylvania
    420307, // Wreck-It Ralph
    173710, // Big Hero 6
    // Drame / Thriller
    1733,   // Scream
    163,    // Ocean's (Soderbergh)
    735323, // Oppenheimer Universe
    8650,   // Hangover
    115575, // Taken
    295164, // Now You See Me
    86082,  // Pitch Perfect
    491,    // Godfather
    550738, // Knives Out
    748,    // X-Men
    // Fantasy / Adventure
    230,    // Godfather
    84,     // Indiana Jones
    84615,  // Maze Runner
    313086, // Divergent
    948485, // Dune (Villeneuve)
    86105,  // Twilight
    735,    // Planet of the Apes
    126209, // Maze Runner alt
    // Comedy
    96871,  // Paddington
    722961, // Puss in Boots
    9818,   // Rush Hour
    97186,  // Horrible Bosses
    8580,   // Night at the Museum
    173710, // Big Hero
    456068, // Detective Pikachu
    // Romance / Musical
    131634, // Fifty Shades
    645731, // After
    948485, // Dune
];

#[derive(Debug, Deserialize)]
struct TmdbCollectionResponse {
    id:            u32,
    name:          String,
    overview:      Option<String>,
    backdrop_path: Option<String>,
    poster_path:   Option<String>,
    #[serde(default)]
    parts:         Vec<TmdbCollectionPart>,
}

#[derive(Debug, Deserialize)]
struct TmdbCollectionPart {
    id:            u32,
    title:         Option<String>,
    overview:      Option<String>,
    poster_path:   Option<String>,
    backdrop_path: Option<String>,
    release_date:  Option<String>,
    #[serde(default)]
    vote_average:  Option<f32>,
    #[serde(default)]
    genre_ids:     Vec<u32>,
}

/// Fetch a collection summary (for listing)
pub async fn fetch_collection_summary(
    collection_id: u32,
    state: &AppState,
) -> Result<serde_json::Value, AppError> {
    let url = format!("{}/collection/{}", TMDB_BASE_URL, collection_id);
    let resp = state.http_client.get(&url)
        .query(&[("api_key", &state.tmdb_key), ("language", &TMDB_LANGUAGE.to_string())])
        .send().await
        .map_err(|e| AppError::NetworkError(format!("TMDB collection {} fetch: {}", collection_id, e)))?;

    let coll: TmdbCollectionResponse = resp.json().await
        .map_err(|e| AppError::ParseError(format!("TMDB collection {} parse: {}", collection_id, e)))?;

    Ok(serde_json::json!({
        "id":            coll.id,
        "name":          coll.name,
        "overview":      coll.overview.unwrap_or_default(),
        "backdrop_path": coll.backdrop_path,
        "poster_path":   coll.poster_path,
        "parts_count":   coll.parts.len(),
    }))
}

/// Fetch full collection detail (with all parts)
pub async fn fetch_collection_detail(
    collection_id: u32,
    state: &AppState,
) -> Result<serde_json::Value, AppError> {
    let url = format!("{}/collection/{}", TMDB_BASE_URL, collection_id);
    let resp = state.http_client.get(&url)
        .query(&[("api_key", &state.tmdb_key), ("language", &TMDB_LANGUAGE.to_string())])
        .send().await
        .map_err(|e| AppError::NetworkError(format!("TMDB collection {} fetch: {}", collection_id, e)))?;

    let coll: TmdbCollectionResponse = resp.json().await
        .map_err(|e| AppError::ParseError(format!("TMDB collection {} parse: {}", collection_id, e)))?;

    let parts: Vec<serde_json::Value> = coll.parts.into_iter().map(|p| {
        let year = p.release_date.as_ref()
            .and_then(|d| d.split('-').next().map(String::from));
        let poster = p.poster_path.as_ref()
            .map(|pp| format!("{}{}", TMDB_IMAGE_BASE, pp));
        let backdrop = p.backdrop_path.clone();

        let genres: Vec<String> = p.genre_ids.iter()
            .filter_map(|&id| tmdb_genre_name(id).map(String::from))
            .collect();

        serde_json::json!({
            "id":            format!("tmdb:{}", p.id),
            "type":          "movie",
            "name":          p.title.unwrap_or_default(),
            "title":         serde_json::Value::Null,
            "poster":        poster,
            "poster_path":   p.poster_path,
            "backdrop_path": backdrop,
            "year":          year,
            "overview":      p.overview,
            "vote_average":  p.vote_average,
            "genres":        if genres.is_empty() { None } else { Some(genres) },
        })
    }).collect();

    Ok(serde_json::json!({
        "id":            coll.id,
        "name":          coll.name,
        "overview":      coll.overview.unwrap_or_default(),
        "backdrop_path": coll.backdrop_path,
        "poster_path":   coll.poster_path,
        "parts":         parts,
    }))
}
