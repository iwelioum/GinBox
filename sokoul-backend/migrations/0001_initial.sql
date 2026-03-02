-- Migration initiale Sokoul Backend
-- ⚠️ WAL mode activé dans main.rs (PRAGMA journal_mode=WAL)
-- Index sur content_id, quality et seeders : critiques pour le tri des flux
-- UNIQUE(imdb_id, season, episode) : garantit zéro doublon d'épisodes

-- Table de cache des métadonnées (Meta Stremio / TMDB)
CREATE TABLE IF NOT EXISTS metas (
    imdb_id         TEXT PRIMARY KEY,
    content_type    TEXT NOT NULL,          -- "movie" | "series"
    name            TEXT NOT NULL,
    poster_url      TEXT,
    background_url  TEXT,
    description     TEXT,
    year            INTEGER,
    genres          TEXT,                   -- JSON array sérialisé
    cached_at       INTEGER NOT NULL        -- Unix timestamp
);

-- Table de cache des épisodes (séries uniquement)
CREATE TABLE IF NOT EXISTS episodes (
    episode_id      TEXT PRIMARY KEY,       -- format "imdb_id:s:e"
    imdb_id         TEXT NOT NULL,
    season          INTEGER NOT NULL,
    episode         INTEGER NOT NULL,
    title           TEXT,
    released        TEXT,
    UNIQUE(imdb_id, season, episode),       -- garantit zéro doublon
    FOREIGN KEY(imdb_id) REFERENCES metas(imdb_id) ON DELETE CASCADE
);

-- Table de cache des streams (résultats agrégés)
CREATE TABLE IF NOT EXISTS streams (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id      TEXT NOT NULL,          -- imdb_id ou "imdb_id:s:e"
    info_hash       TEXT,
    url             TEXT,
    file_index      INTEGER,
    quality         TEXT,
    size_gb         REAL,
    seeders         INTEGER,
    language        TEXT,
    codec           TEXT,
    source          TEXT NOT NULL,          -- "torrentio" | "prowlarr" | "jackett"
    cached_at       INTEGER NOT NULL
);

-- Table de configuration utilisateur
CREATE TABLE IF NOT EXISTS settings (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL
);

-- Index de performance pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_streams_content_id ON streams(content_id);
CREATE INDEX IF NOT EXISTS idx_streams_quality ON streams(quality);
CREATE INDEX IF NOT EXISTS idx_streams_seeders ON streams(seeders DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_imdb ON episodes(imdb_id);
-- Index pour l'expiration du cache : DELETE FROM streams WHERE cached_at < ?
CREATE INDEX IF NOT EXISTS idx_streams_cached_at ON streams(cached_at);
CREATE INDEX IF NOT EXISTS idx_metas_cached_at ON metas(cached_at);