-- ══════════════════════════════════════════════════════════
-- Migration 006 — Contrainte UNIQUE sur user_lists(profile_id, name)
-- Nécessaire pour ON CONFLICT(profile_id, name) dans create_default_lists
-- ══════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lists_profile_name
    ON user_lists(profile_id, name);