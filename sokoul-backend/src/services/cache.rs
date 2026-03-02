use crate::errors::AppError;
use crate::models::{ContentType, Meta, Stream};
use sqlx::{FromRow, SqlitePool};
use std::time::{SystemTime, UNIX_EPOCH};

const META_CACHE_TTL_SECONDS: u64 = 604_800; // 7 j  — métadonnées TMDB

// ── Streams ──────────────────────────────────────────────────────────────────

/// Résultat du cache avec timestamp pour calcul de fraîcheur côté appelant.
pub struct StreamCacheResult {
    pub streams:   Vec<Stream>,
    pub cached_at: u64, // timestamp UNIX (secondes)
}

/// TTL dynamique selon l'ancienneté du contenu (année de sortie).
/// Sans date précise, on approxime à l'année.
pub fn compute_stream_ttl(release_year: Option<u32>) -> u64 {
    let now_secs = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    let current_year = (1970 + now_secs / (365 * 24 * 3600)) as u32;

    let Some(year) = release_year else {
        return 86_400; // 24 h par défaut
    };

    let age = current_year.saturating_sub(year);
    match age {
        0 => 6 * 3600,      // sorti cette année → 6 h
        1 => 86_400,        // 1 an → 24 h
        _ => 7 * 86_400,    // plus ancien → 7 jours
    }
}

#[derive(FromRow, Debug)]
struct DbStream {
    info_hash:  Option<String>,
    url:        Option<String>,
    file_index: Option<i64>,
    quality:    Option<String>,
    size_gb:    Option<f64>,
    seeders:    Option<i64>,
    language:   Option<String>,
    codec:      Option<String>,
    title:      Option<String>,
    cached_at:  i64,
}

/// Retourne tous les streams en cache pour `content_id` (sans filtre TTL).
/// Le TTL est vérifié par l'appelant via `compute_stream_ttl`.
pub async fn get_streams_from_cache(
    content_id: &str,
    db: &SqlitePool,
) -> Result<Option<StreamCacheResult>, AppError> {
    let db_streams = sqlx::query_as::<_, DbStream>(
        r#"
        SELECT info_hash, url, file_index, quality, size_gb, seeders, language, codec, title, cached_at
        FROM streams
        WHERE content_id = ?
        "#,
    )
    .bind(content_id)
    .fetch_all(db)
    .await?;

    if db_streams.is_empty() {
        return Ok(None);
    }

    let cached_at = db_streams[0].cached_at as u64;

    let streams = db_streams
        .into_iter()
        .map(|db_s| Stream {
            info_hash: db_s.info_hash,
            url:       db_s.url,
            file_idx:  db_s.file_index.map(|fi| fi as u32),
            title:     db_s.title,
            behavior_hints: None,
            parsed_meta: crate::models::ParsedStreamMeta {
                quality:  db_s.quality.unwrap_or_else(|| "unknown".to_string()),
                size_gb:  db_s.size_gb.unwrap_or(0.0) as f32,
                seeders:  db_s.seeders.unwrap_or(0) as u32,
                language: db_s.language.unwrap_or_else(|| "unknown".to_string()),
                codec:    db_s.codec.unwrap_or_else(|| "unknown".to_string()),
            },
        })
        .collect();

    Ok(Some(StreamCacheResult { streams, cached_at }))
}

pub async fn cache_streams(
    content_id: &str,
    streams: &[Stream],
    db: &SqlitePool,
) -> Result<(), AppError> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
    let mut tx = db.begin().await?;

    sqlx::query("DELETE FROM streams WHERE content_id = ?")
        .bind(content_id)
        .execute(&mut *tx)
        .await?;

    for stream in streams {
        sqlx::query(
            r#"
            INSERT INTO streams
                (content_id, info_hash, url, file_index, quality, size_gb, seeders, language, codec, source, cached_at, title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(content_id)
        .bind(&stream.info_hash)
        .bind(&stream.url)
        .bind(stream.file_idx)
        .bind(&stream.parsed_meta.quality)
        .bind(stream.parsed_meta.size_gb)
        .bind(stream.parsed_meta.seeders)
        .bind(&stream.parsed_meta.language)
        .bind(&stream.parsed_meta.codec)
        .bind("aggregator")
        .bind(now)
        .bind(&stream.title)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

// ── Métadonnées TMDB ─────────────────────────────────────────────────────────

#[derive(FromRow, Debug)]
struct DbMeta {
    imdb_id:      String,
    content_type: String,
    name:         String,
    poster_url:   Option<String>,
    background_url: Option<String>,
    description:  Option<String>,
    year:         Option<i64>,
    genres:       Option<String>,
}

pub async fn get_cached_meta(
    imdb_id: &str,
    db: &SqlitePool,
) -> Result<Option<Meta>, AppError> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();

    let row = sqlx::query_as::<_, DbMeta>(
        r#"
        SELECT imdb_id, content_type, name, poster_url, background_url, description, year, genres
        FROM metas
        WHERE imdb_id = ? AND cached_at > ?
        "#,
    )
    .bind(imdb_id)
    .bind((now - META_CACHE_TTL_SECONDS) as i64)
    .fetch_optional(db)
    .await?;

    let Some(db_meta) = row else { return Ok(None) };

    let content_type = match db_meta.content_type.as_str() {
        "series" => ContentType::Series,
        _        => ContentType::Movie,
    };

    let genres: Option<Vec<String>> = db_meta.genres
        .and_then(|g| serde_json::from_str(&g).ok());

    Ok(Some(Meta {
        id:           db_meta.imdb_id,
        content_type,
        name:         db_meta.name,
        poster:       db_meta.poster_url,
        background:   db_meta.background_url,
        description:  db_meta.description,
        year:         db_meta.year.map(|y| y as u32),
        genres,
        videos:       None, // Séries : épisodes non stockés dans le cache meta simplifié
    }))
}

pub async fn cache_meta(
    meta: &Meta,
    db: &SqlitePool,
) -> Result<(), AppError> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64;

    let content_type_str = match meta.content_type {
        ContentType::Movie  => "movie",
        ContentType::Series => "series",
    };

    let genres_json = meta.genres
        .as_ref()
        .and_then(|g| serde_json::to_string(g).ok());

    sqlx::query(
        r#"
        INSERT INTO metas (imdb_id, content_type, name, poster_url, background_url, description, year, genres, cached_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(imdb_id) DO UPDATE SET
            name           = excluded.name,
            poster_url     = excluded.poster_url,
            background_url = excluded.background_url,
            description    = excluded.description,
            year           = excluded.year,
            genres         = excluded.genres,
            cached_at      = excluded.cached_at
        "#,
    )
    .bind(&meta.id)
    .bind(content_type_str)
    .bind(&meta.name)
    .bind(&meta.poster)
    .bind(&meta.background)
    .bind(&meta.description)
    .bind(meta.year.map(|y| y as i64))
    .bind(genres_json)
    .bind(now)
    .execute(db)
    .await?;

    Ok(())
}

// ── Nettoyage expiré ──────────────────────────────────────────────────────────

#[allow(dead_code)]
pub async fn cleanup_expired_cache(db: &SqlitePool) -> Result<u64, AppError> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    let mut tx = db.begin().await?;

    // Nettoyer les streams plus vieux que 7 jours (TTL maximum)
    let streams_deleted = sqlx::query("DELETE FROM streams WHERE cached_at < ?")
        .bind((now - 7 * 86_400) as i64)
        .execute(&mut *tx)
        .await?
        .rows_affected();

    let metas_deleted = sqlx::query("DELETE FROM metas WHERE cached_at < ?")
        .bind((now - META_CACHE_TTL_SECONDS) as i64)
        .execute(&mut *tx)
        .await?
        .rows_affected();

    tx.commit().await?;
    Ok(streams_deleted + metas_deleted)
}
