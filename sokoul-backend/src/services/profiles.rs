use sqlx::SqlitePool;
use crate::models::Profile;
use crate::errors::AppError;
use std::time::{SystemTime, UNIX_EPOCH};
use super::lists;

pub async fn create_profile(
    name: &str,
    avatar_url: Option<&str>,
    is_kids: bool,
    db: &SqlitePool,
) -> Result<Profile, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let id = sqlx::query!(
        "INSERT INTO profiles (name, avatar_url, is_kids, created_at) VALUES (?, ?, ?, ?)",
        name,
        avatar_url,
        is_kids,
        now
    )
    .execute(db)
    .await?
    .last_insert_rowid();

    lists::create_default_lists(id, db).await?;

    get_profile(id, db).await
}

pub async fn list_profiles(db: &SqlitePool) -> Result<Vec<Profile>, AppError> {
    let profiles = sqlx::query_as!(
        Profile,
        r#"SELECT id, name, avatar_url, is_kids as "is_kids: bool", trakt_access_token, trakt_refresh_token, trakt_expires_at, created_at FROM profiles ORDER BY created_at ASC"#
    )
    .fetch_all(db)
    .await?;

    Ok(profiles)
}

pub async fn get_profile(id: i64, db: &SqlitePool) -> Result<Profile, AppError> {
    let profile = sqlx::query_as!(
        Profile,
        r#"SELECT id, name, avatar_url, is_kids as "is_kids: bool", trakt_access_token, trakt_refresh_token, trakt_expires_at, created_at FROM profiles WHERE id = ?"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Profile {} not found", id)))?;

    Ok(profile)
}

pub async fn update_profile(
    id: i64,
    name: &str,
    avatar_url: Option<&str>,
    db: &SqlitePool,
) -> Result<Profile, AppError> {
    sqlx::query!(
        "UPDATE profiles SET name = ?, avatar_url = ? WHERE id = ?",
        name,
        avatar_url,
        id
    )
    .execute(db)
    .await?;

    get_profile(id, db).await
}

pub async fn delete_profile(id: i64, db: &SqlitePool) -> Result<(), AppError> {
    sqlx::query!("DELETE FROM profiles WHERE id = ?", id)
        .execute(db)
        .await?;

    Ok(())
}