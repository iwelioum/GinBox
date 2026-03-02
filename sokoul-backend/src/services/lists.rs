use sqlx::{SqlitePool, query_as};
use crate::models::{UserList, ListItem};
use crate::errors::AppError;
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::info;

const MAX_CUSTOM_LISTS: usize = 20;

pub async fn create_default_lists(
    profile_id: i64,
    db: &SqlitePool,
) -> Result<(), AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    sqlx::query!(
        r#"
        INSERT INTO user_lists (profile_id, name, list_type, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(profile_id, name) DO NOTHING
        "#,
        profile_id,
        "❤️ Favoris",
        "favorites",
        true,
        now,
        now
    )
    .execute(db)
    .await?;

    sqlx::query!(
        r#"
        INSERT INTO user_lists (profile_id, name, list_type, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(profile_id, name) DO NOTHING
        "#,
        profile_id,
        "🕐 À voir",
        "watchlist",
        true,
        now,
        now
    )
    .execute(db)
    .await?;

    info!("Default lists created for profile {}", profile_id);
    Ok(())
}

pub async fn get_lists(
    profile_id: i64,
    db: &SqlitePool,
) -> Result<Vec<UserList>, AppError> {
    let lists = query_as!(
        UserList,
        r#"
        SELECT id as "id!: i64", profile_id, name, list_type, is_default as "is_default: bool ", trakt_list_id, created_at, updated_at
        FROM user_lists
        WHERE profile_id = ?
        ORDER BY is_default DESC, updated_at DESC
        "#,
        profile_id
    )
    .fetch_all(db)
    .await?;

    Ok(lists)
}

pub async fn create_list(
    profile_id: i64,
    name: &str,
    db: &SqlitePool,
) -> Result<UserList, AppError> {
    let custom_list_count = sqlx::query!(
        "SELECT COUNT(id) AS count FROM user_lists WHERE profile_id = ? AND is_default = FALSE",
        profile_id
    )
    .fetch_one(db)
    .await?
    .count;

    if custom_list_count as usize >= MAX_CUSTOM_LISTS {
        return Err(AppError::LimitExceeded(format!("Maximum of {} custom lists reached for this profile.", MAX_CUSTOM_LISTS)));
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let id = sqlx::query!(
        "INSERT INTO user_lists (profile_id, name, list_type, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        profile_id,
        name,
        "custom",
        false,
        now,
        now
    )
    .execute(db)
    .await?
    .last_insert_rowid();

    get_user_list(id, profile_id, db).await
}

pub async fn delete_list(
    list_id: i64,
    profile_id: i64,
    db: &SqlitePool,
) -> Result<(), AppError> {
    let list = get_user_list(list_id, profile_id, db).await?;

    if list.is_default {
        return Err(AppError::Forbidden("Default lists cannot be deleted.".into()));
    }

    sqlx::query!("DELETE FROM user_lists WHERE id = ? AND profile_id = ?", list_id, profile_id)
        .execute(db)
        .await?;

    Ok(())
}

pub async fn rename_list(
    list_id: i64,
    profile_id: i64,
    new_name: &str,
    db: &SqlitePool,
) -> Result<UserList, AppError> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
    sqlx::query!(
        "UPDATE user_lists SET name = ?, updated_at = ? WHERE id = ? AND profile_id = ?",
        new_name,
        now,
        list_id,
        profile_id
    )
    .execute(db)
    .await?;

    get_user_list(list_id, profile_id, db).await
}

pub async fn add_to_list(
    list_id: i64,
    content_id: &str,
    content_type: &str,
    title: &str,
    poster_url: Option<&str>,
    db: &SqlitePool,
) -> Result<ListItem, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let sort_order = sqlx::query!(
        "SELECT COALESCE(MAX(sort_order), 0) + 1 AS max_sort_order FROM list_items WHERE list_id = ?",
        list_id
    )
    .fetch_one(db)
    .await?
    .max_sort_order;

    let id = sqlx::query!(
        r#"
        INSERT OR IGNORE INTO list_items (list_id, content_id, content_type, title, poster_url, added_at, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
        list_id,
        content_id,
        content_type,
        title,
        poster_url,
        now,
        sort_order
    )
    .execute(db)
    .await?
    .last_insert_rowid();

    if id == 0 {
        query_as!(ListItem,
            r#"
            SELECT id as "id!: i64", list_id, content_id, content_type, title, poster_url, added_at, sort_order
            FROM list_items
            WHERE list_id = ? AND content_id = ?
            "#,
            list_id, content_id
        ).fetch_one(db).await.map_err(AppError::DatabaseError)
    } else {
        get_list_item(id, db).await
    }
}

pub async fn remove_from_list(
    list_id: i64,
    content_id: &str,
    db: &SqlitePool,
) -> Result<(), AppError> {
    sqlx::query!("DELETE FROM list_items WHERE list_id = ? AND content_id = ?", list_id, content_id)
        .execute(db)
        .await?;

    Ok(())
}

pub async fn get_list_items(
    list_id: i64,
    db: &SqlitePool,
) -> Result<Vec<ListItem>, AppError> {
    let items = query_as!(
        ListItem,
        r#"SELECT id as "id!: i64", list_id, content_id, content_type, title, poster_url, added_at, sort_order FROM list_items WHERE list_id = ? ORDER BY sort_order ASC"#,
        list_id
    )
    .fetch_all(db)
    .await?;

    Ok(items)
}

#[allow(dead_code)]
pub async fn is_in_list(
    list_id: i64,
    content_id: &str,
    db: &SqlitePool,
) -> Result<bool, AppError> {
    let count = sqlx::query!(
        "SELECT COUNT(id) AS count FROM list_items WHERE list_id = ? AND content_id = ?",
        list_id,
        content_id
    )
    .fetch_one(db)
    .await?
    .count;

    Ok(count > 0)
}

pub async fn get_content_lists(
    profile_id: i64,
    content_id: &str,
    db: &SqlitePool,
) -> Result<Vec<i64>, AppError> {
    let list_ids = sqlx::query!(
        r#"
        SELECT ul.id as "id!: i64"
        FROM user_lists ul
        JOIN list_items li ON ul.id = li.list_id
        WHERE ul.profile_id = ? AND li.content_id = ?
        "#,
        profile_id,
        content_id
    )
    .fetch_all(db)
    .await?
    .into_iter()
    .map(|row| row.id)
    .collect();

    Ok(list_ids)
}

async fn get_user_list(list_id: i64, profile_id: i64, db: &SqlitePool) -> Result<UserList, AppError> {
    query_as!(
        UserList,
        r#"
        SELECT id as "id!: i64", profile_id, name, list_type, is_default as "is_default: bool ", trakt_list_id, created_at, updated_at
        FROM user_lists
        WHERE id = ? AND profile_id = ?
        "#,
        list_id,
        profile_id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("List {} not found for profile {}", list_id, profile_id)))
}

async fn get_list_item(item_id: i64, db: &SqlitePool) -> Result<ListItem, AppError> {
    query_as!(ListItem,
        r#"
        SELECT id as "id!: i64", list_id, content_id, content_type, title, poster_url, added_at, sort_order
        FROM list_items
        WHERE id = ?
        "#,
        item_id
    ).fetch_one(db).await.map_err(AppError::DatabaseError)
}