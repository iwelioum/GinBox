-- Ajout de la colonne language_variant pour distinguer TRUEFRENCH/VFF/VF/VOSTFR/MULTi
ALTER TABLE streams ADD COLUMN language_variant TEXT;
