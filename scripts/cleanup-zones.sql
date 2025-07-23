-- Script para eliminar completamente las zonas de la base de datos

-- Eliminar columna zone_id de la tabla reservations si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reservations' AND column_name = 'zone_id') THEN
        ALTER TABLE public.reservations DROP COLUMN zone_id;
    END IF;
END $$;

-- Eliminar tabla zones completamente
DROP TABLE IF EXISTS public.zones CASCADE;

-- Verificar que se eliminó correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'zones';

-- Verificar estructura de reservations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
