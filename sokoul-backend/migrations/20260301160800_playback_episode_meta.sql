-- Ajout des colonnes métadonnées épisode pour les cards "Continuer"
ALTER TABLE playback_entries ADD COLUMN episode_title TEXT;
ALTER TABLE playback_entries ADD COLUMN still_path TEXT;
