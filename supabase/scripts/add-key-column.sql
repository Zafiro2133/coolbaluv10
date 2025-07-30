-- Script simple para agregar la columna key a reservation_items
-- Ejecutar directamente en Supabase SQL Editor

-- Agregar la columna key como TEXT opcional
ALTER TABLE public.reservation_items 
ADD COLUMN IF NOT EXISTS "key" TEXT;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reservation_items' 
AND column_name = 'key'; 