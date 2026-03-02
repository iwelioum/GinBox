use sqlx::SqlitePool;
use crate::errors::AppError;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

const ALLOWED_KEYS: &[&str] = &[
    "audio_language",
    "subtitle_language",
    "subtitle_enabled",
    "passthrough",
    "aspect_mode",
];

pub async fn get_preferences(
    profile_id: i64,
    db: &SqlitePool,
) -> Result<HashMap<String, String>, AppError> {
    let preferences = sqlx::query!(
        "SELECT key, value FROM profile_preferences WHERE profile_id = ?",
        profile_id
    )
    .fetch_all(db)
    .await?
    .into_iter()
    .map(|row| (row.key, row.value))
    .collect();

    Ok(preferences)
}

pub async fn set_preference(
    profile_id: i64,
    key: &str,
    value: &str,
    db: &SqlitePool,
) -> Result<(), AppError> {
    if !ALLOWED_KEYS.contains(&key) {
        return Err(AppError::BadRequest(format!("Unknown preference key: {}", key)));
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    sqlx::query!(
        r#"
        INSERT INTO profile_preferences (profile_id, key, value, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(profile_id, key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        "#,
        profile_id,
        key,
        value,
        now
    )
    .execute(db)
    .await?;

    Ok(())
}

#[allow(dead_code)]
pub async fn get_preference(
    profile_id: i64,
    key: &str,
    db: &SqlitePool,
) -> Result<Option<String>, AppError> {
    if !ALLOWED_KEYS.contains(&key) {
        return Err(AppError::BadRequest(format!("Unknown preference key: {}", key)));
    }

    let preference = sqlx::query!(
        "SELECT value FROM profile_preferences WHERE profile_id = ? AND key = ?",
        profile_id,
        key
    )
    .fetch_optional(db)
    .await?
    .map(|row| row.value);

    Ok(preference)
}