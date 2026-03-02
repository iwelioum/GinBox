use crate::errors::AppError;
use crate::models::{AddMagnetResponse, InstantAvailability, Stream, TorrentInfo, UnrestrictedLink};
use crate::AppState;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{info, warn};

const RD_API_BASE: &str = "https://api.real-debrid.com/rest/1.0";

pub async fn check_instant_availability(
    info_hash: &str,
    state: &AppState,
) -> Result<bool, AppError> {
    let url = format!("{}/torrents/instantAvailability/{}", RD_API_BASE, info_hash);
    let response = state
        .http_client
        .get(&url)
        .bearer_auth(&state.realdebrid_token)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("RD instant availability check failed: {}", e)))?;

    if !response.status().is_success() {
        return Ok(false);
    }

    let availability = response
        .json::<InstantAvailability>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD availability: {}", e)))?;

    Ok(availability.is_cached())
}

async fn add_magnet(
    info_hash: &str,
    state: &AppState,
) -> Result<AddMagnetResponse, AppError> {
    let url = format!("{}/torrents/addMagnet", RD_API_BASE);
    let magnet = format!("magnet:?xt=urn:btih:{}", info_hash);
    let params = [("magnet", magnet)];

    let response = state
        .http_client
        .post(&url)
        .bearer_auth(&state.realdebrid_token)
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("RD addMagnet failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        warn!("Real-Debrid addMagnet error {}: {}", status, error_text);
        return Err(AppError::ExternalApiError(format!(
            "RD addMagnet returned non-200 status: {} - {}",
            status, error_text
        )));
    }

    response
        .json::<AddMagnetResponse>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD addMagnet response: {}", e)))
}

pub async fn add_torrent_file(
    content: Vec<u8>,
    state: &AppState,
) -> Result<AddMagnetResponse, AppError> {
    let url = format!("{}/torrents/addTorrent", RD_API_BASE);

    let response = state
        .http_client
        .put(&url)
        .header("Content-Type", "application/x-bittorrent")
        .bearer_auth(&state.realdebrid_token)
        .body(content)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("RD addTorrent failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        warn!("Real-Debrid addTorrent error {}: {}", status, error_text);
        return Err(AppError::ExternalApiError(format!(
            "RD addTorrent returned non-200 status: {} - {}",
            status, error_text
        )));
    }

    response
        .json::<AddMagnetResponse>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD addTorrent response: {}", e)))
}

async fn select_files(
    torrent_id: &str,
    state: &AppState,
) -> Result<(), AppError> {
    let url = format!("{}/torrents/selectFiles/{}", RD_API_BASE, torrent_id);
    let params = [("files", "all")];

    let response = state
        .http_client
        .post(&url)
        .bearer_auth(&state.realdebrid_token)
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("RD selectFiles failed: {}", e)))?;

    if response.status().is_success() {
        Ok(())
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        warn!("Real-Debrid selectFiles error {}: {}", status, error_text);
        Err(AppError::ExternalApiError(format!(
            "RD selectFiles returned non-200 status: {} - {}",
            status, error_text
        )))
    }
}

pub async fn unrestrict_link(
    link: &str,
    state: &AppState,
) -> Result<UnrestrictedLink, AppError> {
    let url = format!("{}/unrestrict/link", RD_API_BASE);
    let params = [("link", link)];

    let response = state
        .http_client
        .post(&url)
        .bearer_auth(&state.realdebrid_token)
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("RD unrestrict/link failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        warn!("Real-Debrid unrestrict/link error {}: {}", status, error_text);
        return Err(AppError::ExternalApiError(format!(
            "RD unrestrict/link returned non-200 status: {} - {}",
            status, error_text
        )));
    }

    response
        .json::<UnrestrictedLink>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse RD unrestrict response: {}", e)))
}

pub async fn get_direct_link(
    stream: &Stream,
    state: &AppState,
) -> Result<String, AppError> {
    let info_hash = stream.info_hash.as_ref().ok_or_else(|| {
        AppError::NotFound("Stream does not have an info_hash".to_string())
    })?;

    if check_instant_availability(info_hash, state).await? {
        info!("Torrent {} is instantly available on Real-Debrid.", info_hash);
    }

    let add_magnet_response = add_magnet(info_hash, state).await?;
    poll_for_direct_link(&add_magnet_response.id, state).await
}

pub async fn get_direct_link_from_file(
    content: Vec<u8>,
    state: &AppState,
) -> Result<String, AppError> {
    let add_response = add_torrent_file(content, state).await?;
    poll_for_direct_link(&add_response.id, state).await
}

async fn poll_for_direct_link(
    torrent_id: &str,
    state: &AppState,
) -> Result<String, AppError> {
    select_files(torrent_id, state).await?;

    let mut delay_seconds = 2;
    let max_delay_seconds = 16;
    let total_timeout = Duration::from_secs(300);
    let start_time = std::time::Instant::now();

    loop {
        if start_time.elapsed() > total_timeout {
            return Err(AppError::ExternalApiError(
                "Real-Debrid timeout after 5min".to_string(),
            ));
        }

        let torrent_info_url = format!("{}/torrents/info/{}", RD_API_BASE, torrent_id);
        let torrent_info_response = state
            .http_client
            .get(&torrent_info_url)
            .bearer_auth(&state.realdebrid_token)
            .send()
            .await
            .map_err(|e| AppError::NetworkError(format!("RD torrent info polling failed: {}", e)))?;
        
        let torrent_info: TorrentInfo = torrent_info_response
            .json()
            .await
            .map_err(|e| AppError::ParseError(format!("Failed to parse RD torrent info: {}", e)))?;

        match torrent_info.status.as_str() {
            "downloaded" => {
                info!("Torrent {} downloaded on Real-Debrid.", torrent_id);
                let link_to_unrestrict = torrent_info.links.first().ok_or_else(|| AppError::NotFound("No links found in RD torrent info".to_string()))?;
                let unrestricted = unrestrict_link(link_to_unrestrict, state).await?;
                return Ok(unrestricted.download);
            }
            "downloading" | "waiting_files_selection" | "queued" | "compressing" | "uploading" => {
                info!("Polling RD for torrent {}: status is '{}'. Retrying in {}s.", torrent_id, torrent_info.status, delay_seconds);
                sleep(Duration::from_secs(delay_seconds)).await;
                delay_seconds = (delay_seconds * 2).min(max_delay_seconds);
            }
            "error" | "magnet_error" | "virus" | "dead" => {
                return Err(AppError::ExternalApiError(format!(
                    "Real-Debrid torrent failed with status: {}",
                    torrent_info.status
                )));
            }
            _ => {
                return Err(AppError::ExternalApiError(format!(
                    "Unknown Real-Debrid status: {}",
                    torrent_info.status
                )));
            }
        }
    }
}
