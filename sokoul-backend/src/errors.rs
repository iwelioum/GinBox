use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Failed to parse response: {0}")]
    ParseError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("External API error: {0}")]
    ExternalApiError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Limit exceeded: {0}")]
    LimitExceeded(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("HTTP error: {0}")]
    HttpError(#[from] reqwest::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, error_message) = match &self {
            AppError::NetworkError(msg) => (StatusCode::BAD_GATEWAY, "NETWORK_ERROR", msg.clone()),
            AppError::ParseError(msg) => (StatusCode::UNPROCESSABLE_ENTITY, "PARSE_ERROR", msg.clone()),
            AppError::DatabaseError(err) => {
                tracing::error!("Database error: {err}");
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "An internal database error occurred".to_string())
            },
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::ExternalApiError(msg) => (StatusCode::BAD_GATEWAY, "EXTERNAL_API_ERROR", msg.clone()),
            AppError::ConfigError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "CONFIG_ERROR", msg.clone()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, "FORBIDDEN", msg.clone()),
            AppError::LimitExceeded(msg) => (StatusCode::UNPROCESSABLE_ENTITY, "LIMIT_EXCEEDED", msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", msg.clone()),
            AppError::ApiError(msg) => (StatusCode::BAD_GATEWAY, "API_ERROR", msg.clone()),
            AppError::HttpError(err) => {
                // Log status only — full error may contain API keys in URL
                tracing::error!("HTTP request failed: status={:?}", err.status());
                (StatusCode::BAD_GATEWAY, "HTTP_ERROR", "An external service request failed".to_string())
            },
        };

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": error_message,
            }
        }));

        (status, body).into_response()
    }
}