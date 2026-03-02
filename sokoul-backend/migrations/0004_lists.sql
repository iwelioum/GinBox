-- ══════════════════════════════════════════════════════════
-- Migration 004 — Listes personnalisées
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_lists (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id     INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name           TEXT    NOT NULL,
    list_type      TEXT    NOT NULL DEFAULT 'custom',
    is_default     INTEGER NOT NULL DEFAULT 0,    -- 0=custom, 1=défaut non supprimable
    trakt_list_id  TEXT,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS list_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id      INTEGER NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
    content_id   TEXT    NOT NULL,
    content_type TEXT    NOT NULL,
    -- Dénormalisé pour affichage offline < 5ms sans appel TMDB
    -- Compromis accepté : titre figé à la langue au moment de l'ajout
    title        TEXT    NOT NULL,
    poster_url   TEXT,
    added_at     INTEGER NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    UNIQUE(list_id, content_id)    -- INSERT OR IGNORE safe
);

CREATE INDEX IF NOT EXISTS idx_lists_profile   ON user_lists(profile_id);
CREATE INDEX IF NOT EXISTS idx_lists_updated   ON user_lists(updated_at DESC); -- HomeScreen rail "Mes Listes" trié par récence
CREATE INDEX IF NOT EXISTS idx_items_list      ON list_items(list_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_items_content   ON list_items(content_id);
-- ⚠️ CASCADE 2 niveaux : profil → listes → items (nettoyage automatique)
-- ⚠️ UNIQUE(list_id, content_id) : idempotence de add_to_list
-- ⚠️ Quota 20 listes : vérifié en application (services/lists.rs), pas en SQL