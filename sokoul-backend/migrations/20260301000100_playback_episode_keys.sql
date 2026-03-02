CREATE TABLE IF NOT EXISTS playback_entries_new (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id   INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_id   TEXT    NOT NULL,
    content_type TEXT    NOT NULL,
    season       INTEGER NOT NULL DEFAULT 0,
    episode      INTEGER NOT NULL DEFAULT 0,
    position_ms  INTEGER NOT NULL DEFAULT 0,
    duration_ms  INTEGER NOT NULL DEFAULT 0,
    progress_pct REAL    NOT NULL DEFAULT 0.0,
    watched      INTEGER NOT NULL DEFAULT 0,
    updated_at   INTEGER NOT NULL,
    UNIQUE(profile_id, content_id, season, episode)
);

INSERT INTO playback_entries_new (
    id,
    profile_id,
    content_id,
    content_type,
    season,
    episode,
    position_ms,
    duration_ms,
    progress_pct,
    watched,
    updated_at
)
SELECT
    id,
    profile_id,
    content_id,
    content_type,
    0 AS season,
    0 AS episode,
    position_ms,
    duration_ms,
    progress_pct,
    watched,
    updated_at
FROM playback_entries;

DROP TABLE playback_entries;
ALTER TABLE playback_entries_new RENAME TO playback_entries;

CREATE INDEX IF NOT EXISTS idx_playback_profile ON playback_entries(profile_id);
CREATE INDEX IF NOT EXISTS idx_playback_updated ON playback_entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_content_episode ON playback_entries(content_id, season, episode);
