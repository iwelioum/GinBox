-- Migration fanart_logos
-- ⚠️ cached_at OBLIGATOIRE : permet l'expiration du cache négatif après 30 jours
-- Sans cached_at : cache négatif permanent → logos tardifs jamais découverts
-- ⚠️ P09 — Cache négatif : logo_url = "" indique "pas de logo" avec TTL 30j
CREATE TABLE IF NOT EXISTS fanart_logos (
    imdb_id   TEXT    PRIMARY KEY,
    logo_url  TEXT    NOT NULL,         -- "" si logo absent (cache négatif)
    cached_at INTEGER NOT NULL          -- Unix timestamp OBLIGATOIRE pour TTL 30j
);

-- Index pour l'expiration du cache négatif : SELECT/DELETE WHERE cached_at < now - 30j
CREATE INDEX IF NOT EXISTS idx_fanart_cached_at ON fanart_logos(cached_at);