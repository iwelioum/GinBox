use sqlx::SqlitePool;
use crate::models::PlaybackEntry;
use crate::errors::AppError;
use std::time::{SystemTime, UNIX_EPOCH};

fn normalize_entry(mut entry: PlaybackEntry) -> PlaybackEntry {
    if entry.season == Some(0) {
        entry.season = None;
    }
    if entry.episode == Some(0) {
        entry.episode = None;
    }
    entry
}

#[allow(clippy::too_many_arguments)]
pub async fn save_position(
    profile_id: i64,
    content_id: &str,
    content_type: &str,
    season: Option<u32>,
    episode: Option<u32>,
    position_ms: i64,
    duration_ms: i64,
    episode_title: Option<&str>,
    still_path: Option<&str>,
    db: &SqlitePool,
) -> Result<(), AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let progress_pct = if duration_ms > 0 {
        (position_ms as f32 / duration_ms as f32) * 100.0
    } else {
        0.0
    };

    let watched = progress_pct >= 90.0;
    let season_key = season.map(i64::from).unwrap_or(0);
    let episode_key = episode.map(i64::from).unwrap_or(0);

    sqlx::query!(
        r#"
        INSERT INTO playback_entries (profile_id, content_id, content_type, season, episode, position_ms, duration_ms, progress_pct, watched, updated_at, episode_title, still_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(profile_id, content_id, season, episode) DO UPDATE SET
            position_ms = excluded.position_ms,
            duration_ms = excluded.duration_ms,
            progress_pct = excluded.progress_pct,
            watched = excluded.watched,
            updated_at = excluded.updated_at,
            episode_title = excluded.episode_title,
            still_path = excluded.still_path
        "#,
        profile_id,
        content_id,
        content_type,
        season_key,
        episode_key,
        position_ms,
        duration_ms,
        progress_pct,
        watched,
        now,
        episode_title,
        still_path
    )
    .execute(db)
    .await?;

    Ok(())
}

pub async fn get_position(
    profile_id: i64,
    content_id: &str,
    season: Option<u32>,
    episode: Option<u32>,
    db: &SqlitePool,
) -> Result<Option<PlaybackEntry>, AppError> {
    let season_key = season.map(i64::from).unwrap_or(0);
    let episode_key = episode.map(i64::from).unwrap_or(0);

    let entry: Option<PlaybackEntry> = sqlx::query_as!(
        PlaybackEntry,
        r#"SELECT id as "id!: i64", profile_id, content_id, content_type, season as "season: Option<u32>", episode as "episode: Option<u32>", position_ms, duration_ms, progress_pct as "progress_pct: f32", watched as "watched: bool", updated_at, episode_title, still_path FROM playback_entries WHERE profile_id = ? AND content_id = ? AND season = ? AND episode = ?"#,
        profile_id,
        content_id,
        season_key,
        episode_key
    )
    .fetch_optional(db)
    .await?;

    Ok(entry.map(normalize_entry))
}

pub async fn get_history(
    profile_id: i64,
    limit: u32,
    db: &SqlitePool,
) -> Result<Vec<PlaybackEntry>, AppError> {
    let history: Vec<PlaybackEntry> = sqlx::query_as!(
        PlaybackEntry,
        r#"SELECT id as "id!: i64", profile_id, content_id, content_type, season as "season: Option<u32>", episode as "episode: Option<u32>", position_ms, duration_ms, progress_pct as "progress_pct: f32", watched as "watched: bool", updated_at, episode_title, still_path FROM playback_entries WHERE profile_id = ? ORDER BY updated_at DESC LIMIT ?"#,
        profile_id,
        limit
    )
    .fetch_all(db)
    .await?;

    Ok(history.into_iter().map(normalize_entry).collect())
}

#[allow(dead_code)]
pub async fn mark_watched(
    profile_id: i64,
    content_id: &str,
    season: Option<u32>,
    episode: Option<u32>,
    db: &SqlitePool,
) -> Result<(), AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let season_key = season.map(i64::from).unwrap_or(0);
    let episode_key = episode.map(i64::from).unwrap_or(0);

    sqlx::query!(
        "UPDATE playback_entries SET watched = 1, progress_pct = 100.0, updated_at = ? WHERE profile_id = ? AND content_id = ? AND season = ? AND episode = ?",
        now,
        profile_id,
        content_id,
        season_key,
        episode_key
    )
    .execute(db)
    .await?;

    Ok(())
}
