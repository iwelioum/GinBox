use crate::errors::AppError;
use crate::models::{DeviceAuthResponse, TraktTokenResponse, TraktTokens, TraktScrobblePayload, TraktMovie, TraktShow, TraktEpisode, TraktIds, TraktRatingResponse, TraktCommentRaw, TraktComment, TraktReviewsResponse};
use crate::AppState;
use sqlx::SqlitePool;
use std::time::{SystemTime, UNIX_EPOCH};
use serde_json::json;
use tracing::{warn, info};

pub async fn start_device_auth(state: &AppState) -> Result<DeviceAuthResponse, AppError> {
    let response = state.http_client
        .post("https://api.trakt.tv/oauth/device/code")
        .json(&json!({
            "client_id": state.trakt_client_id
        }))
        .send()
        .await?
        .json::<DeviceAuthResponse>()
        .await?;

    Ok(response)
}

pub async fn poll_device_auth(
    device_code: &str,
    profile_id: i64,
    state: &AppState,
) -> Result<TraktTokens, AppError> {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
    let timeout = tokio::time::Instant::now() + tokio::time::Duration::from_secs(600);

    while tokio::time::Instant::now() < timeout {
        interval.tick().await;

        let res = state.http_client
            .post("https://api.trakt.tv/oauth/device/token")
            .json(&json!({
                "code": device_code,
                "client_id": state.trakt_client_id,
                "client_secret": state.trakt_client_secret
            }))
            .send()
            .await?;

        if res.status().is_success() {
            let tokens = res.json::<TraktTokenResponse>().await?;
            let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
            let expires_at = now + tokens.expires_in;

            sqlx::query!(
                "UPDATE profiles SET trakt_access_token = ?, trakt_refresh_token = ?, trakt_expires_at = ? WHERE id = ?",
                tokens.access_token,
                tokens.refresh_token,
                expires_at,
                profile_id
            )
            .execute(&state.db)
            .await?;

            return Ok(TraktTokens {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at,
            });
        } else if res.status().as_u16() == 400 {
            continue;
        } else {
            return Err(AppError::ApiError(format!("Trakt auth failed: {}", res.status())));
        }
    }

    Err(AppError::ApiError("Trakt auth timed out".into()))
}

pub async fn refresh_token_if_needed(
    profile_id: i64,
    db: &SqlitePool,
    state: &AppState,
) -> Result<Option<String>, AppError> {
    let profile = sqlx::query!(
        "SELECT trakt_access_token, trakt_refresh_token, trakt_expires_at FROM profiles WHERE id = ?",
        profile_id
    )
    .fetch_one(db)
    .await?;

    let (access_token, refresh_token, expires_at) = match (profile.trakt_access_token, profile.trakt_refresh_token, profile.trakt_expires_at) {
        (Some(a), Some(r), Some(e)) => (a, r, e),
        _ => return Ok(None),
    };

    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
    
    if expires_at < now + (7 * 24 * 3600) {
        let res = state.http_client
            .post("https://api.trakt.tv/oauth/token")
            .json(&json!({
                "refresh_token": refresh_token,
                "client_id": state.trakt_client_id,
                "client_secret": state.trakt_client_secret,
                "grant_type": "refresh_token"
            }))
            .send()
            .await?;

        if res.status().is_success() {
            let tokens = res.json::<TraktTokenResponse>().await?;
            let expires_at = now + tokens.expires_in;

            sqlx::query!(
                "UPDATE profiles SET trakt_access_token = ?, trakt_refresh_token = ?, trakt_expires_at = ? WHERE id = ?",
                tokens.access_token,
                tokens.refresh_token,
                expires_at,
                profile_id
            )
            .execute(db)
            .await?;

            Ok(Some(tokens.access_token))
        } else {
            warn!("Failed to refresh Trakt token for profile {}", profile_id);
            Ok(None)
        }
    } else {
        Ok(Some(access_token))
    }
}

async fn send_scrobble(
    action: &str,
    profile_id: i64,
    content_id: &str,
    content_type: &str,
    progress: f32,
    state: &AppState,
) -> Result<(), AppError> {
    let token = match refresh_token_if_needed(profile_id, &state.db, state).await? {
        Some(t) => t,
        None => return Ok(()),
    };

    let payload = if content_id.starts_with("tt") {
        let ids = TraktIds {
            trakt: 0,
            slug: None,
            imdb: Some(content_id.to_string()),
            tmdb: None,
        };

        if content_type == "movie" {
            TraktScrobblePayload {
                movie: Some(TraktMovie { ids }),
                show: None,
                episode: None,
                progress,
            }
        } else {
            if content_id.contains(':') {
                let parts: Vec<&str> = content_id.split(':').collect();
                if parts.len() == 3 {
                    let imdb = parts[0].to_string();
                    let season = parts[1].parse().unwrap_or(1);
                    let episode = parts[2].parse().unwrap_or(1);
                    TraktScrobblePayload {
                        movie: None,
                        show: Some(TraktShow { ids: TraktIds { trakt: 0, slug: None, imdb: Some(imdb), tmdb: None } }),
                        episode: Some(TraktEpisode { ids: TraktIds { trakt: 0, slug: None, imdb: None, tmdb: None }, season, number: episode }),
                        progress,
                    }
                } else {
                    return Ok(());
                }
            } else {
                return Ok(());
            }
        }
    } else {
        return Ok(());
    };

    let url = format!("https://api.trakt.tv/scrobble/{}", action);
    let res = state.http_client
        .post(url)
        .header("Authorization", format!("Bearer {}", token))
        .header("trakt-api-version", "2")
        .header("trakt-api-key", &state.trakt_client_id)
        .json(&payload)
        .send()
        .await;

    match res {
        Ok(r) if !r.status().is_success() => {
            warn!("Trakt scrobble {} failed with status {}", action, r.status());
        },
        Err(e) => {
            warn!("Trakt scrobble {} network error: {:?}", action, e);
        },
        _ => {
            info!("Trakt scrobble {} successful for {}", action, content_id);
        }
    }

    Ok(())
}

pub async fn scrobble_start(
    profile_id: i64,
    content_id: &str,
    content_type: &str,
    progress: f32,
    state: &AppState,
) -> Result<(), AppError> {
    send_scrobble("start", profile_id, content_id, content_type, progress, state).await
}

pub async fn scrobble_pause(
    profile_id: i64,
    content_id: &str,
    content_type: &str,
    progress: f32,
    state: &AppState,
) -> Result<(), AppError> {
    send_scrobble("pause", profile_id, content_id, content_type, progress, state).await
}

pub async fn scrobble_stop(
    profile_id: i64,
    content_id: &str,
    content_type: &str,
    progress: f32,
    state: &AppState,
) -> Result<(), AppError> {
    send_scrobble("stop", profile_id, content_id, content_type, progress, state).await
}

// ── Reviews + note Trakt (endpoint public) ───────────────
pub async fn get_reviews(
    content_type: &str,
    id: &str,
    state: &AppState,
) -> Result<TraktReviewsResponse, AppError> {
    // Resolve IMDB ID: accepts tt... directly, otherwise resolves via TMDB
    let trakt_id = if id.starts_with("tt") {
        id.to_string()
    } else {
        // Extract the numeric ID (e.g. "tmdb:12345" → "12345")
        let numeric = id.split(':').last().unwrap_or(id);
        // Try to resolve via Trakt API /search/tmdb
        let url = format!(
            "https://api.trakt.tv/search/tmdb/{}?type={}",
            numeric,
            if content_type == "movie" { "movie" } else { "show" }
        );
        let res = state.http_client
            .get(&url)
            .header("trakt-api-version", "2")
            .header("trakt-api-key", &state.trakt_client_id)
            .send()
            .await;

        match res {
            Ok(r) if r.status().is_success() => {
                let results: serde_json::Value = r.json().await.unwrap_or_default();
                // Extract the slug or trakt id from the response
                let slug = if content_type == "movie" {
                    results[0]["movie"]["ids"]["slug"].as_str()
                } else {
                    results[0]["show"]["ids"]["slug"].as_str()
                };
                slug.unwrap_or(numeric).to_string()
            },
            _ => numeric.to_string(),
        }
    };

    let media_seg = if content_type == "movie" { "movies" } else { "shows" };

    // Ratings call (public)
    let rating_url = format!("https://api.trakt.tv/{}/{}/ratings", media_seg, trakt_id);
    let rating_res = state.http_client
        .get(&rating_url)
        .header("trakt-api-version", "2")
        .header("trakt-api-key", &state.trakt_client_id)
        .send()
        .await;

    let (rating, votes, pct_liked) = match rating_res {
        Ok(r) if r.status().is_success() => {
            if let Ok(data) = r.json::<TraktRatingResponse>().await {
                let liked: u32 = [6u32, 7, 8, 9, 10]
                    .iter()
                    .filter_map(|k| data.distribution.get(&k.to_string()))
                    .sum();
                let pct = if data.votes > 0 {
                    ((liked as f64 / data.votes as f64) * 100.0) as u32
                } else { 0 };
                (data.rating, data.votes, pct)
            } else {
                (0.0, 0, 0)
            }
        },
        _ => (0.0, 0, 0),
    };

    // Comments call (public)
    let comments_url = format!(
        "https://api.trakt.tv/{}/{}/comments?sort=likes&limit=3",
        media_seg, trakt_id
    );
    let comments_res = state.http_client
        .get(&comments_url)
        .header("trakt-api-version", "2")
        .header("trakt-api-key", &state.trakt_client_id)
        .send()
        .await;

    let comments: Vec<TraktComment> = match comments_res {
        Ok(r) if r.status().is_success() => {
            r.json::<Vec<TraktCommentRaw>>().await
                .unwrap_or_default()
                .into_iter()
                .map(|c| TraktComment {
                    id: c.id,
                    comment: c.comment,
                    spoiler: c.spoiler,
                    likes: c.likes,
                    created_at: c.created_at,
                    author: c.user.username,
                })
                .collect()
        },
        _ => vec![],
    };

    Ok(TraktReviewsResponse { rating, votes, pct_liked, comments })
}