-- ══════════════════════════════════════════════════════════
-- Migration 003 — Profils, Historique, Tokens Trakt
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL,
    avatar_url          TEXT,
    is_kids             INTEGER NOT NULL DEFAULT 0,  -- 0=adulte, 1=enfant
    trakt_access_token  TEXT,
    trakt_refresh_token TEXT,
    trakt_expires_at    INTEGER,
    created_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS playback_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id   INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_id   TEXT    NOT NULL,
    content_type TEXT    NOT NULL,
    position_ms  INTEGER NOT NULL DEFAULT 0,
    duration_ms  INTEGER NOT NULL DEFAULT 0,
    progress_pct REAL    NOT NULL DEFAULT 0.0,
    watched      INTEGER NOT NULL DEFAULT 0,  -- 0=non vu, 1=vu (>= 90%)
    updated_at   INTEGER NOT NULL,
    UNIQUE(profile_id, content_id)             -- Une seule entrée par profil/contenu
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_playback_profile ON playback_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_playback_updated ON playback_history(updated_at DESC);

-- ⚠️ ON DELETE CASCADE : suppression profil → suppression historique automatique
-- ⚠️ UNIQUE(profile_id, content_id) : UPSERT safe — pas de doublons
-- ⚠️ Index updated_at DESC : HomeScreen "Continuer à regarder" = tri par récence