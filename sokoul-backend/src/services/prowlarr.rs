use crate::errors::AppError;
use crate::models::{ContentType, ProwlarrRelease, Stream};
use crate::parser::parse_stream_title;
use crate::AppState;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ProwlarrResponse {
    #[serde(default)]
    results: Vec<ProwlarrRelease>,
}

pub async fn search_prowlarr(
    query: &str,
    content_type: &ContentType,
    state: &AppState,
) -> Result<Vec<ProwlarrRelease>, AppError> {
    let categories = match content_type {
        ContentType::Movie => "2000",
        ContentType::Series => "5000",
    };

    let url = format!(
        "{}/api/v1/search?query={}&categories={}&limit=50",
        state.prowlarr_url,
        query,
        categories
    );

    let response = state
        .http_client
        .get(&url)
        .header("X-Api-Key", &state.prowlarr_key)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("Failed to search Prowlarr: {}", e)))?;

    if !response.status().is_success() {
        return Err(AppError::ExternalApiError(format!(
            "Prowlarr returned non-200 status: {}",
            response.status()
        )));
    }
    
    let text = response.text().await.map_err(|e| AppError::NetworkError(format!("Failed to read Prowlarr response body: {}", e)))?;
    let prowlarr_response = serde_json::from_str::<Vec<ProwlarrRelease>>(&text)
        .map_err(|e| AppError::ParseError(format!("Failed to parse Prowlarr response: {}. Body: {}", e, text)))?;

    Ok(prowlarr_response)
}

pub fn normalize_prowlarr_release(release: ProwlarrRelease) -> Stream {
    let mut parsed_meta = parse_stream_title(&release.title);
    parsed_meta.size_gb = release.size as f32 / 1_073_741_824.0;
    parsed_meta.seeders = release.seeders;

    Stream {
        info_hash: release.info_hash,
        url: release.download_url,
        file_idx: None,
        title: Some(release.title),
        parsed_meta,
        behavior_hints: None,
    }
}

fn build_query(base_query: &str, content_type: &ContentType, season: Option<u32>, episode: Option<u32>) -> String {
    if !matches!(content_type, ContentType::Series) {
        return base_query.to_string();
    }

    match (season, episode) {
        (Some(s), Some(e)) => format!("{} S{:02}E{:02}", base_query, s, e),
        (Some(s), None) => format!("{} Season {}", base_query, s),
        _ => base_query.to_string(),
    }
}

pub async fn fetch_prowlarr_streams(
    query: &str,
    content_type: &ContentType,
    season: Option<u32>,
    episode: Option<u32>,
    state: &AppState,
) -> Result<Vec<Stream>, AppError> {
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let formatted_query = build_query(query, content_type, season, episode);
    let releases = search_prowlarr(&formatted_query, content_type, state).await?;
    let streams = releases.into_iter().map(normalize_prowlarr_release).collect();
    Ok(streams)
}
