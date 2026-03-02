-- ══════════════════════════════════════════════════════════
-- Migration 005 — Préférences par profil (clé-valeur)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profile_preferences (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    key        TEXT    NOT NULL,
    value      TEXT    NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(profile_id, key)    -- Une valeur par clé par profil — UPSERT safe
);

CREATE INDEX IF NOT EXISTS idx_prefs_profile ON profile_preferences(profile_id);

-- Clés supportées (v1) — validation dans preferences.rs :
-- audio_language    : code ISO 639-1 (ex: "fr", "en", "ja")
-- subtitle_language : code ISO 639-1 ou "none"
-- subtitle_enabled  : "true" | "false"
-- passthrough       : "true" | "false"
-- aspect_mode       : "fit" | "stretch" | "zoom"
--
-- ⚠️ Table générique : ajout de nouvelles clés sans migration supplémentaire
-- ⚠️ ON DELETE CASCADE : suppression profil → suppression préférences
-- ⚠️ UNIQUE(profile_id, key) : INSERT OR REPLACE safe (UPSERT)
-- ⚠️ Validation des clés : côté application (preferences.rs ALLOWED_KEYS)
--    pas en SQL — permet l'extensibilité sans contrainte CHECK rigide