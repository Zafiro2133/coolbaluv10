-- Eliminación completa del sistema de zonas
-- Fecha: 2025-01-31

-- 1. Eliminar la columna zone_id de la tabla reservations
ALTER TABLE public.reservations 
DROP COLUMN IF EXISTS zone_id;

-- 2. Eliminar la tabla zones completamente
DROP TABLE IF EXISTS public.zones CASCADE;

-- 3. Eliminar cualquier función relacionada con zonas (si existe)
DROP FUNCTION IF EXISTS update_zones_updated_at() CASCADE;

-- 4. Verificar que no hay referencias restantes
DO $$
BEGIN
    -- Verificar que la columna zone_id fue eliminada
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'zone_id'
    ) THEN
        RAISE EXCEPTION 'La columna zone_id aún existe en reservations';
    END IF;
    
    -- Verificar que la tabla zones fue eliminada
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'zones'
    ) THEN
        RAISE EXCEPTION 'La tabla zones aún existe';
    END IF;
    
    RAISE NOTICE '✅ Sistema de zonas eliminado completamente';
END $$; 