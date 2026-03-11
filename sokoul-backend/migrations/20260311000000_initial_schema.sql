-- ══════════════════════════════════════════════════════════════════════════════
-- Sokoul Backend — Initial Schema
-- ══════════════════════════════════════════════════════════════════════════════
-- Single consolidated migration replacing 13 incremental files.
-- Decision: ADR-008 (docs/DECISIONS.md) — migration reset for pre-production project.
-- WAL mode activated in main.rs via PRAGMA journal_mode=WAL.
-- ══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: metas
-- Metadata cache for TMDB content (movies & series).
-- TTL enforced in application code (varies by content age).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS metas (
    imdb_id         TEXT    PRIMARY KEY,
    content_type    TEXT    NOT NULL,           -- 'movie' | 'series'
    name            TEXT    NOT NULL,
    poster_url      TEXT,
    background_url  TEXT,
    description     TEXT,
    year            INTEGER,
    genres          TEXT,                       -- JSON array serialized
    cached_at       INTEGER NOT NULL            -- Unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_metas_cached_at
    ON metas(cached_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: episodes
-- Episode cache for series. One row per episode.
-- Foreign key to metas ensures cascade cleanup.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS episodes (
    episode_id      TEXT    PRIMARY KEY,        -- format "imdb_id:season:episode"
    imdb_id         TEXT    NOT NULL,
    season          INTEGER NOT NULL,
    episode         INTEGER NOT NULL,
    title           TEXT,
    released        TEXT,
    CONSTRAINT uq_episodes_imdb_season_ep
        UNIQUE(imdb_id, season, episode),
    CONSTRAINT fk_episodes_metas
        FOREIGN KEY(imdb_id) REFERENCES metas(imdb_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_episodes_imdb
    ON episodes(imdb_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: streams
-- Aggregated stream results cache from Torrentio, Prowlarr, Wastream.
-- TTL: current year 6h, last year 24h, older 7 days.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS streams (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id          TEXT    NOT NULL,       -- imdb_id or "imdb_id:s:e"
    info_hash           TEXT,
    url                 TEXT,
    file_index          INTEGER,
    title               TEXT,                   -- raw torrent title
    quality             TEXT,
    size_gb             REAL,
    seeders             INTEGER,
    language            TEXT,
    codec               TEXT,
    language_variant    TEXT,                   -- TRUEFRENCH/VFF/VF/VOSTFR/MULTi/FRENCH
    source              TEXT    NOT NULL,       -- 'torrentio' | 'prowlarr' | 'wastream'
    cached_at           INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_streams_content_id
    ON streams(content_id);
CREATE INDEX IF NOT EXISTS idx_streams_quality
    ON streams(quality);
CREATE INDEX IF NOT EXISTS idx_streams_seeders
    ON streams(seeders DESC);
CREATE INDEX IF NOT EXISTS idx_streams_cached_at
    ON streams(cached_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: settings
-- Global key-value configuration (non-profile-specific).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: fanart_logos
-- Fanart.tv logo URL cache with negative cache support (logo_url = '').
-- TTL: 30 days for negative cache, indefinite for positive.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fanart_logos (
    imdb_id     TEXT    PRIMARY KEY,
    logo_url    TEXT    NOT NULL,               -- '' = no logo (negative cache)
    cached_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fanart_cached_at
    ON fanart_logos(cached_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: profiles
-- User profiles with optional Trakt integration.
-- Corresponds to models.rs::Profile (sqlx::FromRow).
-- Fields: id, name, avatar_url, is_kids, trakt_*, created_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL,
    avatar_url          TEXT,
    is_kids             INTEGER NOT NULL DEFAULT 0,    -- 0=adult, 1=kids
    trakt_access_token  TEXT,
    trakt_refresh_token TEXT,
    trakt_expires_at    INTEGER,
    created_at          INTEGER NOT NULL
);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: playback_entries
-- Per-episode playback history. Supports resume and "continue watching".
-- Corresponds to models.rs::PlaybackEntry (sqlx::FromRow).
-- Fields: id, profile_id, content_id, content_type, season, episode,
--         position_ms, duration_ms, progress_pct, watched, updated_at,
--         episode_title, still_path
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS playback_entries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id      INTEGER NOT NULL,
    content_id      TEXT    NOT NULL,
    content_type    TEXT    NOT NULL,           -- 'movie' | 'series'
    season          INTEGER NOT NULL DEFAULT 0,
    episode         INTEGER NOT NULL DEFAULT 0,
    position_ms     INTEGER NOT NULL DEFAULT 0,
    duration_ms     INTEGER NOT NULL DEFAULT 0,
    progress_pct    REAL    NOT NULL DEFAULT 0.0,
    watched         INTEGER NOT NULL DEFAULT 0,-- 0=unwatched, 1=watched (>=90%)
    updated_at      INTEGER NOT NULL,
    episode_title   TEXT,
    still_path      TEXT,
    CONSTRAINT uq_playback_profile_content_episode
        UNIQUE(profile_id, content_id, season, episode),
    CONSTRAINT fk_playback_profiles
        FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playback_profile
    ON playback_entries(profile_id);
CREATE INDEX IF NOT EXISTS idx_playback_updated
    ON playback_entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_content_episode
    ON playback_entries(content_id, season, episode);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: user_lists
-- User-created and default watchlists, optionally synced with Trakt.
-- Corresponds to models.rs::UserList (sqlx::FromRow).
-- Fields: id, profile_id, name, list_type, is_default, trakt_list_id,
--         created_at, updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_lists (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id      INTEGER NOT NULL,
    name            TEXT    NOT NULL,
    list_type       TEXT    NOT NULL DEFAULT 'custom',
    is_default      INTEGER NOT NULL DEFAULT 0,-- 0=custom, 1=non-deletable default
    trakt_list_id   TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    CONSTRAINT fk_user_lists_profiles
        FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lists_profile_name
    ON user_lists(profile_id, name);
CREATE INDEX IF NOT EXISTS idx_lists_profile
    ON user_lists(profile_id);
CREATE INDEX IF NOT EXISTS idx_lists_updated
    ON user_lists(updated_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: list_items
-- Items within a user list. Denormalized title/poster for offline display.
-- Corresponds to models.rs::ListItem (sqlx::FromRow).
-- Fields: id, list_id, content_id, content_type, title, poster_url,
--         added_at, sort_order
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS list_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id         INTEGER NOT NULL,
    content_id      TEXT    NOT NULL,
    content_type    TEXT    NOT NULL,
    title           TEXT    NOT NULL,
    poster_url      TEXT,
    added_at        INTEGER NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_list_items_list_content
        UNIQUE(list_id, content_id),
    CONSTRAINT fk_list_items_lists
        FOREIGN KEY(list_id) REFERENCES user_lists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_list
    ON list_items(list_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_items_content
    ON list_items(content_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: profile_preferences
-- Per-profile key-value preferences. Generic schema, validated in app code.
-- Supported keys (v1): audio_language, subtitle_language, subtitle_enabled,
--                       passthrough, aspect_mode
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_preferences (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL,
    key         TEXT    NOT NULL,
    value       TEXT    NOT NULL,
    updated_at  INTEGER NOT NULL,
    CONSTRAINT uq_prefs_profile_key
        UNIQUE(profile_id, key),
    CONSTRAINT fk_prefs_profiles
        FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prefs_profile
    ON profile_preferences(profile_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: user_progress
-- Content tracking status per profile (plan_to_watch, in_progress, etc.).
-- Corresponds to models.rs::UserProgress (sqlx::FromRow).
-- Fields: id, profile_id, content_id, status, progress, rating, updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_progress (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL,
    content_id  TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'plan_to_watch',
    progress    REAL    NOT NULL DEFAULT 0.0,   -- 0.0–100.0
    rating      REAL,
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    CONSTRAINT uq_progress_profile_content
        UNIQUE(profile_id, content_id),
    CONSTRAINT fk_progress_profiles
        FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_progress_profile
    ON user_progress(profile_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Table: artwork_cache
-- Per-content artwork bundle cache (Fanart.tv + TMDB best URLs).
-- Bundle stored as JSON to avoid schema churn. TTL: 7 days in app code.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artwork_cache (
    tmdb_id     TEXT    NOT NULL,
    media_type  TEXT    NOT NULL,               -- 'movie' | 'tv'
    bundle      TEXT    NOT NULL,               -- ArtworkBundle as JSON
    fetched_at  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (tmdb_id, media_type)
);
