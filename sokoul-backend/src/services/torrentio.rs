use crate::errors::AppError;
use crate::models::{ContentType, Stream};
use crate::parser::parse_stream_title;
use crate::AppState;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct TorrentioResponse {
    streams: Vec<Stream>,
}

pub async fn fetch_torrentio_streams(
    imdb_id: &str,
    content_type: &ContentType,
    season: Option<u32>,
    episode: Option<u32>,
    state: &AppState,
) -> Result<Vec<Stream>, AppError> {
    if !imdb_id.starts_with("tt") {
        return Ok(Vec::new());
    }

    let stream_path = match (content_type, season, episode) {
        (ContentType::Series, Some(s), Some(e)) => {
            format!("stream/series/{}:{}:{}.json", imdb_id, s, e)
        }
        (ContentType::Movie, _, _) => format!("stream/movie/{}.json", imdb_id),
        (ContentType::Series, _, _) => format!("stream/series/{}.json", imdb_id),
    };

    // Config Real-Debrid depuis AppState (jamais depuis env directement)
    let torrentio_config = if state.realdebrid_token.is_empty() {
        String::new()
    } else {
        format!("realdebrid={}", state.realdebrid_token)
    };
    let url = if torrentio_config.is_empty() {
        format!("https://torrentio.strem.fun/{}", stream_path)
    } else {
        format!("https://torrentio.strem.fun/{}/{}", torrentio_config, stream_path)
    };

    let response = state
        .http_client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("Failed to fetch from Torrentio: {}", e)))?;

    if !response.status().is_success() {
        return Err(AppError::ExternalApiError(format!(
            "Torrentio returned non-200 status: {}",
            response.status()
        )));
    }

    let torrentio_response = response
        .json::<TorrentioResponse>()
        .await
        .map_err(|e| AppError::ParseError(format!("Failed to parse Torrentio response: {}", e)))?;

    let enriched_streams: Vec<Stream> = torrentio_response
        .streams
        .into_iter()
        .filter_map(|mut stream| {
            if stream.info_hash.is_none() && stream.url.is_none() {
                return None;
            }
            if let Some(title) = &stream.title {
                stream.parsed_meta = parse_stream_title(title);
            }
            Some(stream)
        })
        .collect();

    Ok(enriched_streams)
}
