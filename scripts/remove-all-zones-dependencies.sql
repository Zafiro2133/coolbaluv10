-- Script completo para eliminar todas las dependencias de zonas
-- Ejecutar manualmente en Supabase SQL Editor
-- Fecha: 2025-01-31

-- 1. Eliminar políticas relacionadas con zones
DROP POLICY IF EXISTS "Admins can manage zones" ON public.zones;
DROP POLICY IF EXISTS "Anyone can view zones" ON public.zones;
DROP POLICY IF EXISTS "Zones are viewable by everyone" ON public.zones;

-- 2. Eliminar la columna zone_id de reservations si existe
ALTER TABLE public.reservations DROP COLUMN IF EXISTS zone_id;

-- 3. Eliminar la tabla zones completamente
DROP TABLE IF EXISTS public.zones CASCADE;

-- 4. Eliminar funciones relacionadas con zones
DROP FUNCTION IF EXISTS update_zones_updated_at() CASCADE;

-- 5. Eliminar triggers relacionados con zones
DROP TRIGGER IF EXISTS update_zones_updated_at ON public.zones;

-- 6. Verificar y eliminar cualquier foreign key que referencie zones
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.referenced_table_name = 'zones'
    LOOP
        EXECUTE 'ALTER TABLE public.' || constraint_record.table_name || 
                ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
    END LOOP;
END $$;

-- 7. Eliminar cualquier vista que haga referencia a zones
DROP VIEW IF EXISTS reservation_details_with_extra_hours CASCADE;

-- 8. Recrear la vista sin referencias a zones
CREATE OR REPLACE VIEW reservation_details_with_extra_hours AS
SELECT 
    r.id,
    r.user_id,
    r.event_date,
    r.event_time,
    r.event_address,
    r.phone,
    r.adult_count,
    r.child_count,
    r.comments,
    r.rain_reschedule,
    r.subtotal,
    r.transport_cost,
    r.total,
    r.status,
    r.payment_proof_url,
    r.created_at,
    r.updated_at,
    p.name as product_name,
    p.price as product_price,
    ri.quantity,
    ri.extra_hours,
    ri.extra_hour_percentage,
    ri.item_total,
    (ri.extra_hours * ri.extra_hour_percentage / 100.0) as extra_hours_cost
FROM public.reservations r
LEFT JOIN public.reservation_items ri ON r.id = ri.reservation_id
LEFT JOIN public.products p ON ri.product_id = p.id
GROUP BY 
    r.id, r.user_id, r.event_date, r.event_time, r.event_address, 
    r.phone, r.adult_count, r.child_count, r.comments, r.rain_reschedule,
    r.subtotal, r.transport_cost, r.total, r.status, r.payment_proof_url,
    r.created_at, r.updated_at, p.name, p.price, ri.quantity, 
    ri.extra_hours, ri.extra_hour_percentage, ri.item_total;

-- 9. Crear función temporal para reemplazar el sistema de zonas
CREATE OR REPLACE FUNCTION public.get_transport_cost_for_address(address TEXT)
RETURNS DECIMAL(10,2)
LANGUAGE SQL
STABLE
AS $$
    -- Sin sistema de zonas, retornar un costo fijo o 0
    SELECT 0.00::DECIMAL(10,2);
$$;

-- 10. Verificar que no hay referencias restantes
DO $$
DECLARE
    zone_refs INTEGER;
BEGIN
    -- Contar referencias a zones en foreign keys
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
    
    -- Verificar que la tabla zones no existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zones') THEN
        RAISE EXCEPTION 'La tabla zones aún existe';
    END IF;
    
    -- Verificar que la columna zone_id no existe en reservations
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'zone_id') THEN
        RAISE EXCEPTION 'La columna zone_id aún existe en reservations';
    END IF;
    
    RAISE NOTICE '✅ Sistema de zonas eliminado completamente';
    RAISE NOTICE '✅ Todas las dependencias han sido removidas';
    RAISE NOTICE '✅ La aplicación puede funcionar sin el sistema de zonas';
END $$;

-- 11. Comentarios finales
COMMENT ON FUNCTION public.get_transport_cost_for_address(TEXT) IS 'Función temporal para reemplazar el sistema de zonas eliminado. Retorna 0 como costo de transporte.'; 