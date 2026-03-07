-- Artwork bundle cache — stores per-source best URLs for poster, logo, backdrop, banner.
-- TTL enforced in application code (7 days). JSON column avoids schema churn on bundle changes.
CREATE TABLE IF NOT EXISTS artwork_cache (
    tmdb_id    TEXT NOT NULL,
    media_type TEXT NOT NULL,  -- 'movie' | 'tv'
    bundle     TEXT NOT NULL,  -- ArtworkBundle as JSON
    fetched_at INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (tmdb_id, media_type)
);
