-- ══════════════════════════════════════════════════════════
-- Migration 008 — Progression utilisateur par profil
-- RÈGLES : UNIQUE(profile_id, content_id) pour upsert safe
--          ON DELETE CASCADE : suppression profil → suppression progression
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_progress (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_id  TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'plan_to_watch',
    progress    REAL    NOT NULL DEFAULT 0.0,
    rating      REAL,
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(profile_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_profile ON user_progress(profile_id);
