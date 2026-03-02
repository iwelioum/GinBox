-- Ajout de la colonne title sur la table streams
-- Nécessaire pour afficher le titre du torrent dans SourcesPage
ALTER TABLE streams ADD COLUMN title TEXT;
