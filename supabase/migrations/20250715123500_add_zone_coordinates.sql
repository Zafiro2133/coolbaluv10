-- Agrega el campo coordinates a la tabla zones para almacenar polígonos
ALTER TABLE public.zones
ADD COLUMN coordinates JSONB;

-- Opcional: actualiza el comentario de la tabla
COMMENT ON COLUMN public.zones.coordinates IS 'Coordenadas del polígono de la zona en formato GeoJSON'; 