-- Script para actualizar zonas con la estructura actual de la base de datos

-- Eliminar zonas existentes
DELETE FROM public.zones;

-- Insertar zonas correctas de Rosario usando solo las columnas existentes
INSERT INTO public.zones (name, description, transport_cost, is_active) VALUES
  ('Rosario Centro', 'Centro de Rosario y barrios c��ntricos', 5000.00, true),
  ('Rosario Norte', 'Zona norte de Rosario', 6000.00, true),
  ('Rosario Sur', 'Zona sur de Rosario', 6000.00, true),
  ('Rosario Oeste', 'Zona oeste de Rosario', 7000.00, true),
  ('Rosario Este', 'Zona este de Rosario', 7000.00, true),
  ('Alrededores Cercanos', 'Localidades cercanas a Rosario', 8000.00, true);

-- Verificar los datos insertados
SELECT id, name, description, transport_cost, is_active FROM public.zones;
