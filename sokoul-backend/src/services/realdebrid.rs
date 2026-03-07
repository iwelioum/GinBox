// ══════════════════════════════════════════════════════════
// realdebrid.rs — Real-Debrid API with:
//   1. Adaptive rate limiter (429 → double, success → recover)
//   2. Cache detection via re-add magnet + 500ms probe
//   3. Automatic fallback on 503 (re-add + unrestrict new link)
// Inspired by DebridMovieMapper (rd_client.rs + repair.rs + dav_fs.rs)
// ══════════════════════════════════════════════════════════

use crate::errors::AppError;
use crate::models::{AddMagnetResponse, InstantAvailability, Stream, TorrentInfo, UnrestrictedLink};
use crate::AppState;
use std::sync::OnceLock;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::sleep;
use tracing::{info, warn};

const RD_API_BASE: &str = "https://api.real-debrid.com/rest/1.0";

// ── Adaptive rate limiter (singleton) ──────────────────────────────────────
// Inspired by DebridMovieMapper AdaptiveRateLimiter (rd_client.rs)
// 429 → double the interval (cap 2000ms), respect Retry-After
// Success → reduce by 10ms (floor 100ms)
const MIN_INTERVAL_MS: u64 = 100;
const MAX_INTERVAL_MS: u64 = 2000;
const RECOVERY_MS: u64 = 10;
const MAX_RETRIES: u32 = 10;

struct RateLimiterState {
    interval_ms: u64,
    next_allowed: tokio::time::Instant,
}

fn rate_limiter() -> &'static Mutex<RateLimiterState> {
    static LIMITER: OnceLock<Mutex<RateLimiterState>> = OnceLock::new();
    LIMITER.get_or_init(|| {
        Mutex::new(RateLimiterState {
            interval_ms: MIN_INTERVAL_MS,
            next_allowed: tokio::time::Instant::now(),
        })
    })
}

async fn wait_for_token() {
    let deadline = {
        let mut state = rate_limiter().lock().await;
        let now = tokio::time::Instant::now();
        if state.next_allowed < now {
            state.next_allowed = now;
        }
        let deadline = state.next_allowed;
        let interval = Duration::from_millis(state.interval_ms);
        state.next_allowed += interval;
        deadline
    };
    tokio::time::sleep_until(deadline).await;
}

async fn record_success() {
    let mut state = rate_limiter().lock().await;
    state.interval_ms = state.interval_ms.saturating_sub(RECOVERY_MS).max(MIN_INTERVAL_MS);
}

async fn record_throttle(retry_after: Option<u64>) {
    let mut state = rate_limiter().lock().await;
    state.interval_ms = (state.interval_ms * 2).min(MAX_INTERVAL_MS);
    if let Some(seconds) = retry_after {
        let capped = seconds.min(300);
        let retry_deadline = tokio::time::Instant::now() + Duration::from_secs(capped);
        if retry_deadline > state.next_allowed {
            state.next_allowed = retry_deadline;
        }
    }
}

// ── RD request with adaptive retry ─────────────────────────────────────────
// Retry: 429 (rate limit), 502 (bad gateway), 504 (gateway timeout)
// No retry: 503 (broken link → handled by repair fallback at caller level)
async fn rd_request_with_retry(
    build_request: impl Fn() -> reqwest::RequestBuilder,
) -> Result<reqwest::Response, AppError> {
    let mut last_error: Option<AppError> = None;

    for attempt in 1..=MAX_RETRIES {
        wait_for_token().await;

        let resp = match build_request().send().await {
            Ok(r) => r,
            Err(e) => {
                warn!("RD network (attempt {}/{}): {}", attempt, MAX_RETRIES, e);
                last_error = Some(AppError::NetworkError(format!("RD request failed: {}", e)));
                let backoff_ms = (500 * 2u64.pow((attempt - 1).min(6))).min(30_000);
                sleep(Duration::from_millis(backoff_ms)).await;
                continue;
            }
        };

        let status = resp.status();

        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            let retry_after = resp
                .headers()
                .get(reqwest::header::RETRY_AFTER)
                .and_then(|h| h.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok());
            record_throttle(retry_after).await;
            warn!("RD 429 (attempt {}/{})", attempt, MAX_RETRIES);
            continue;
        }

        if status == reqwest::StatusCode::BAD_GATEWAY
            || status == reqwest::StatusCode::GATEWAY_TIMEOUT
        {
            let backoff_ms = (500 * 2u64.pow((attempt - 1).min(6))).min(30_000);
            warn!(
                "RD {} (attempt {}/{}), retry in {}ms",
                status, attempt, MAX_RETRIES, backoff_ms
            );
            sleep(Duration::from_millis(backoff_ms)).await;
            continue;
        }

        if status.is_success() {
            record_success().await;
        }
        return Ok(resp);
    }

    Err(last_error.unwrap_or_else(|| {
        AppError::ExternalApiError("Real-Debrid: maximum number of attempts exceeded".into())
    }))
}

// ══════════════════════════════════════════════════════════
// Real-Debrid API functions (all rate-limited)
// ══════════════════════════════════════════════════════════

#[allow(dead_code)]
pub async fn check_instant_availability(
    info_hash: &str,
    state: &AppState,
) -> Result<bool, AppError> {
    let url = format!("{}/torrents/instantAvailability/{}", RD_API_BASE, info_hash);
    let token = state.realdebrid_token.clone();
    let client = state.http_client.clone();

    let resp = rd_request_with_retry(|| client.get(&url).bearer_auth(&token)).await?;

    if !resp.status().is_success() {
        return Ok(false);
    }

    let availability = resp
        .json::<InstantAvailability>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD availability: {}", e)))?;

    Ok(availability.is_cached())
}

async fn add_magnet(info_hash: &str, state: &AppState) -> Result<AddMagnetResponse, AppError> {
    let url = format!("{}/torrents/addMagnet", RD_API_BASE);
    let magnet = format!("magnet:?xt=urn:btih:{}", info_hash);
    let token = state.realdebrid_token.clone();
    let client = state.http_client.clone();

    let resp = rd_request_with_retry(|| {
        client
            .post(&url)
            .bearer_auth(&token)
            .form(&[("magnet", &magnet)])
    })
    .await?;

    let status = resp.status();
    if !status.is_success() {
        let error_text = resp.text().await.unwrap_or_default();
        warn!("RD addMagnet error {}: {}", status, error_text);
        return Err(AppError::ExternalApiError(format!(
            "RD addMagnet {}: {}",
            status, error_text
        )));
    }

    resp.json::<AddMagnetResponse>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD addMagnet: {}", e)))
}

pub async fn add_torrent_file(
    content: Vec<u8>,
    state: &AppState,
) -> Result<AddMagnetResponse, AppError> {
    let url = format!("{}/torrents/addTorrent", RD_API_BASE);
    let token = state.realdebrid_token.clone();
    let client = state.http_client.clone();

    let resp = rd_request_with_retry(|| {
        client
            .put(&url)
            .header("Content-Type", "application/x-bittorrent")
            .bearer_auth(&token)
            .body(content.clone())
    })
    .await?;

    let status = resp.status();
    if !status.is_success() {
        let error_text = resp.text().await.unwrap_or_default();
        warn!("RD addTorrent error {}: {}", status, error_text);
        return Err(AppError::ExternalApiError(format!(
            "RD addTorrent {}: {}",
            status, error_text
        )));
    }

    resp.json::<AddMagnetResponse>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD addTorrent: {}", e)))
}

async fn select_files(torrent_id: &str, state: &AppState) -> Result<(), AppError> {
    let url = format!("{}/torrents/selectFiles/{}", RD_API_BASE, torrent_id);
    let token = state.realdebrid_token.clone();
    let client = state.http_client.clone();

    let resp = rd_request_with_retry(|| {
        client
            .post(&url)
            .bearer_auth(&token)
            .form(&[("files", "all")])
    })
    .await?;

    if resp.status().is_success() {
        Ok(())
    } else {
        let status = resp.status();
        let error_text = resp.text().await.unwrap_or_default();
        warn!("RD selectFiles error {}: {}", status, error_text);
        Err(AppError::ExternalApiError(format!(
            "RD selectFiles {}: {}",
            status, error_text
        )))
    }
}

async fn get_torrent_info(torrent_id: &str, state: &AppState) -> Result<TorrentInfo, AppError> {
    let url = format!("{}/torrents/info/{}", RD_API_BASE, torrent_id);
    let token = state.realdebrid_token.clone();
    let client = state.http_client.clone();

    let resp = rd_request_with_retry(|| client.get(&url).bearer_auth(&token)).await?;

    resp.json::<TorrentInfo>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD torrent info: {}", e)))
}

// ── Unrestrict with 503 fallback ────────────────────────────────────────────
// If 503 and info_hash available → re-add magnet, check cache, unrestrict new link
// If 503 without info_hash → explicit error (no silent failure)

pub async fn unrestrict_link(
    link: &str,
    state: &AppState,
) -> Result<UnrestrictedLink, AppError> {
    unrestrict_with_repair(link, None, state).await
}

async fn unrestrict_with_repair(
    link: &str,
    info_hash: Option<&str>,
    state: &AppState,
) -> Result<UnrestrictedLink, AppError> {
    let url = format!("{}/unrestrict/link", RD_API_BASE);

    for attempt in 1..=MAX_RETRIES {
        wait_for_token().await;

        let resp = state
            .http_client
            .post(&url)
            .bearer_auth(&state.realdebrid_token)
            .form(&[("link", link)])
            .send()
            .await
            .map_err(|e| AppError::NetworkError(format!("RD unrestrict failed: {}", e)))?;

        let status = resp.status();

        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            let retry_after = resp
                .headers()
                .get(reqwest::header::RETRY_AFTER)
                .and_then(|h| h.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok());
            record_throttle(retry_after).await;
            warn!("RD unrestrict 429 (attempt {}/{})", attempt, MAX_RETRIES);
            continue;
        }

        if status == reqwest::StatusCode::BAD_GATEWAY
            || status == reqwest::StatusCode::GATEWAY_TIMEOUT
        {
            let backoff_ms = (500 * 2u64.pow((attempt - 1).min(6))).min(30_000);
            warn!(
                "RD unrestrict {} (attempt {}/{})",
                status, attempt, MAX_RETRIES
            );
            sleep(Duration::from_millis(backoff_ms)).await;
            continue;
        }

        // 503 → expired/broken link, attempt repair via re-add magnet
        if status == reqwest::StatusCode::SERVICE_UNAVAILABLE {
            let error_text = resp.text().await.unwrap_or_default();
            warn!("RD unrestrict 503: {} — link expired", error_text);

            if let Some(hash) = info_hash {
                info!("Repair attempt: re-add magnet {}", hash);
                return try_repair_and_unrestrict(hash, state).await;
            }

            return Err(AppError::ExternalApiError(
                "Real-Debrid link expired (503). Retry with a new magnet.".into(),
            ));
        }

        if !status.is_success() {
            let error_text = resp.text().await.unwrap_or_default();
            warn!("RD unrestrict error {}: {}", status, error_text);
            return Err(AppError::ExternalApiError(format!(
                "RD unrestrict/link {}: {}",
                status, error_text
            )));
        }

        record_success().await;
        return resp
            .json::<UnrestrictedLink>()
            .await
            .map_err(|e| AppError::ParseError(format!("Failed to parse unrestrict: {}", e)));
    }

    Err(AppError::ExternalApiError(
        "RD unrestrict : max retries exceeded".into(),
    ))
}

// ── 503 Repair: re-add magnet → cache probe → unrestrict ───────────────
// Inspired by DebridMovieMapper repair.rs::try_instant_repair
async fn try_repair_and_unrestrict(
    info_hash: &str,
    state: &AppState,
) -> Result<UnrestrictedLink, AppError> {
    info!("503 Repair: re-add magnet {}", info_hash);

    let add_response = add_magnet(info_hash, state).await?;
    select_files(&add_response.id, state).await?;

    // Wait 500ms for RD processing (cf. DebridMovieMapper)
    sleep(Duration::from_millis(500)).await;

    let torrent_info = get_torrent_info(&add_response.id, state).await?;

    if torrent_info.status == "downloaded" && !torrent_info.links.is_empty() {
        info!(
            "✓ Repair succeeded: torrent {} cached on RD",
            info_hash
        );
        let link = torrent_info.links.first()
            .ok_or_else(|| AppError::ExternalApiError("No debrid links available after repair".into()))?;
        // Unrestrict without 503 fallback (avoid infinite loop)
        return unrestrict_simple(link, state).await;
    }

    Err(AppError::ExternalApiError(format!(
        "Torrent {} not cached on Real-Debrid (status: {}). Download required, try again later.",
        info_hash, torrent_info.status
    )))
}

/// Simple unrestrict (rate-limited, retry 429/502/504, no 503 fallback)
async fn unrestrict_simple(link: &str, state: &AppState) -> Result<UnrestrictedLink, AppError> {
    let url = format!("{}/unrestrict/link", RD_API_BASE);
    let token = state.realdebrid_token.clone();
    let client = state.http_client.clone();
    let link_owned = link.to_string();

    let resp = rd_request_with_retry(|| {
        client
            .post(&url)
            .bearer_auth(&token)
            .form(&[("link", &link_owned)])
    })
    .await?;

    let status = resp.status();
    if !status.is_success() {
        let error_text = resp.text().await.unwrap_or_default();
        return Err(AppError::ExternalApiError(format!(
            "RD unrestrict (after repair) {}: {}",
            status, error_text
        )));
    }

    resp.json::<UnrestrictedLink>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse unrestrict: {}", e)))
}

// ══════════════════════════════════════════════════════════
// Main pipeline: magnet/file → RD → direct URL
// Cache detection: select → 500ms probe → if "downloaded" = cached
// ══════════════════════════════════════════════════════════

pub struct DirectLinkResult {
    pub url: String,
    pub is_cached: bool,
}

pub async fn get_direct_link(
    stream: &Stream,
    state: &AppState,
) -> Result<DirectLinkResult, AppError> {
    let info_hash = stream
        .info_hash
        .as_ref()
        .ok_or_else(|| AppError::NotFound("Stream without info_hash".into()))?;

    let add_response = add_magnet(info_hash, state).await?;
    prepare_and_resolve(&add_response.id, Some(info_hash), state).await
}

pub async fn get_direct_link_from_file(
    content: Vec<u8>,
    state: &AppState,
) -> Result<DirectLinkResult, AppError> {
    let add_response = add_torrent_file(content, state).await?;
    prepare_and_resolve(&add_response.id, None, state).await
}

/// Internal pipeline:
/// 1. File selection
/// 2. Cache probe (500ms, inspired by DebridMovieMapper try_instant_repair)
/// 3. If "downloaded" → immediate unrestrict (is_cached=true)
/// 4. Otherwise → poll with exponential backoff (is_cached=false)
async fn prepare_and_resolve(
    torrent_id: &str,
    info_hash: Option<&str>,
    state: &AppState,
) -> Result<DirectLinkResult, AppError> {
    select_files(torrent_id, state).await?;

    // Fast cache probe (500ms)
    sleep(Duration::from_millis(500)).await;
    let torrent_info = get_torrent_info(torrent_id, state).await?;

    if torrent_info.status == "downloaded" && !torrent_info.links.is_empty() {
        info!("✓ Torrent {} cached (instant availability)", torrent_id);
        let link = torrent_info.links.first()
            .ok_or_else(|| AppError::ExternalApiError("No debrid links available".into()))?;
        let unrestricted = unrestrict_with_repair(link, info_hash, state).await?;
        return Ok(DirectLinkResult {
            url: unrestricted.download,
            is_cached: true,
        });
    }

    // Not cached → poll with exponential backoff
    info!(
        "Torrent {} not cached (status: {}), polling...",
        torrent_id, torrent_info.status
    );
    let mut delay_secs = 2u64;
    let total_timeout = Duration::from_secs(300);
    let start = std::time::Instant::now();

    loop {
        if start.elapsed() > total_timeout {
            return Err(AppError::ExternalApiError(
                "Real-Debrid: timeout after 5 minutes".into(),
            ));
        }

        sleep(Duration::from_secs(delay_secs)).await;
        let info = get_torrent_info(torrent_id, state).await?;

        match info.status.as_str() {
            "downloaded" => {
                info!("Torrent {} downloaded on Real-Debrid", torrent_id);
                let link = info
                    .links
                    .first()
                    .ok_or_else(|| AppError::NotFound("No link in RD torrent".into()))?;
                let unrestricted = unrestrict_with_repair(link, info_hash, state).await?;
                return Ok(DirectLinkResult {
                    url: unrestricted.download,
                    is_cached: false,
                });
            }
            "downloading" | "waiting_files_selection" | "queued" | "compressing" | "uploading" => {
                info!(
                    "Polling torrent {}: '{}', retry in {}s",
                    torrent_id, info.status, delay_secs
                );
                delay_secs = (delay_secs * 2).min(16);
            }
            "error" | "magnet_error" | "virus" | "dead" => {
                return Err(AppError::ExternalApiError(format!(
                    "RD torrent failed: {}",
                    info.status
                )));
            }
            _ => {
                return Err(AppError::ExternalApiError(format!(
                    "Unknown RD status: {}",
                    info.status
                )));
            }
        }
    }
}
