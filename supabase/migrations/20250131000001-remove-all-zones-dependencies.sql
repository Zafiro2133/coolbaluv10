-- Eliminación completa de todas las dependencias de zonas
-- Fecha: 2025-01-31
-- Esta migración elimina todas las referencias restantes a zonas en políticas y verificaciones

-- 1. Eliminar políticas relacionadas con zones
DROP POLICY IF EXISTS "Admins can manage zones" ON public.zones;
DROP POLICY IF EXISTS "Anyone can view zones" ON public.zones;

-- 2. Eliminar verificaciones de existencia de zones en migraciones anteriores
-- Estas verificaciones están en el DO $$ block de la migración 20250118000000-add-rain-reschedule-field.sql
-- No podemos modificar migraciones anteriores, pero podemos crear una nueva migración que elimine estas dependencias

-- 3. Verificar y eliminar cualquier función que haga referencia a zones
DROP FUNCTION IF EXISTS update_zones_updated_at() CASCADE;

-- 4. Eliminar cualquier trigger relacionado con zones
DROP TRIGGER IF EXISTS update_zones_updated_at ON public.zones;

-- 5. Verificar que no hay referencias restantes en el esquema
DO $$
DECLARE
    zone_refs INTEGER;
BEGIN
    -- Contar referencias a zones en el esquema
    SELECT COUNT(*) INTO zone_refs
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    )
    AND constraint_definition LIKE '%zones%';
    
    IF zone_refs > 0 THEN
        RAISE EXCEPTION 'Aún existen % referencias a zones en foreign keys', zone_refs;
    END IF;
    
    -- Verificar que no hay políticas que referencien zones
    SELECT COUNT(*) INTO zone_refs
    FROM pg_policies 
    WHERE tablename = 'zones' OR schemaname = 'zones';
    
    IF zone_refs > 0 THEN
        RAISE EXCEPTION 'Aún existen % políticas que referencian zones', zone_refs;
    END IF;
    
    RAISE NOTICE '✅ Todas las dependencias de zones han sido eliminadas';
END $$;

-- 6. Limpiar cualquier comentario relacionado con zones
COMMENT ON TABLE IF EXISTS public.zones IS NULL;

-- 7. Verificar que la aplicación puede funcionar sin zones
-- Crear una función de verificación que simule el comportamiento sin zones
CREATE OR REPLACE FUNCTION public.get_transport_cost_for_address(address TEXT)
RETURNS DECIMAL(10,2)
LANGUAGE SQL
STABLE
AS $$
    -- Sin sistema de zonas, retornar un costo fijo o 0
    SELECT 0.00::DECIMAL(10,2);
$$;

-- 8. Documentar que el sistema de zonas ha sido eliminado
COMMENT ON FUNCTION public.get_transport_cost_for_address(TEXT) IS 'Función temporal para reemplazar el sistema de zonas eliminado. Retorna 0 como costo de transporte.'; 