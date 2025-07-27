-- =====================================================
-- MIGRACIÓN: Solucionar problemas con el campo extra_hours
-- Fecha: 2025-01-21
-- Problemas identificados:
-- 1. Campo extra_hours faltante en tabla reservations
-- 2. Inconsistencias en tipos de datos
-- 3. Validaciones faltantes
-- 4. Funciones de cálculo que no consideran extra_hours
-- =====================================================

-- 1. Agregar campo extra_hours a la tabla reservations si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'extra_hours'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN extra_hours INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE '✅ Campo extra_hours agregado a la tabla reservations';
    ELSE
        RAISE NOTICE 'ℹ️ Campo extra_hours ya existe en la tabla reservations';
    END IF;
END $$;

-- 2. Verificar y corregir el tipo de datos en reservation_items
DO $$
BEGIN
    -- Verificar si extra_hour_percentage es INTEGER y cambiarlo a DECIMAL si es necesario
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation_items' 
        AND column_name = 'extra_hour_percentage'
        AND data_type = 'integer'
    ) THEN
        -- Crear una tabla temporal con la estructura correcta
        CREATE TEMP TABLE temp_reservation_items AS 
        SELECT 
            id,
            reservation_id,
            product_id,
            product_name,
            product_price,
            quantity,
            extra_hours,
            CAST(extra_hour_percentage AS DECIMAL(5,2)) AS extra_hour_percentage,
            item_total,
            created_at
        FROM public.reservation_items;
        
        -- Eliminar la tabla original
        DROP TABLE public.reservation_items;
        
        -- Recrear con el tipo correcto
        CREATE TABLE public.reservation_items (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES public.products(id),
            product_name TEXT NOT NULL,
            product_price DECIMAL(10,2) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            extra_hours INTEGER NOT NULL DEFAULT 0,
            extra_hour_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
            item_total DECIMAL(10,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Restaurar los datos
        INSERT INTO public.reservation_items 
        SELECT * FROM temp_reservation_items;
        
        -- Eliminar tabla temporal
        DROP TABLE temp_reservation_items;
        
        RAISE NOTICE '✅ Tipo de datos de extra_hour_percentage corregido a DECIMAL(5,2)';
    ELSE
        RAISE NOTICE 'ℹ️ Tipo de datos de extra_hour_percentage ya es correcto';
    END IF;
END $$;

-- 3. Agregar validaciones para el campo extra_hours
DO $$
BEGIN
    -- Agregar constraint para extra_hours en reservations si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_extra_hours_reservations' 
        AND table_name = 'reservations'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT check_extra_hours_reservations 
        CHECK (extra_hours >= 0);
    END IF;
    
    -- Agregar constraint para extra_hours en reservation_items si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_extra_hours_reservation_items' 
        AND table_name = 'reservation_items'
    ) THEN
        ALTER TABLE public.reservation_items 
        ADD CONSTRAINT check_extra_hours_reservation_items 
        CHECK (extra_hours >= 0);
    END IF;
    
    RAISE NOTICE '✅ Validaciones para extra_hours agregadas';
END $$;

-- 4. Crear función para calcular el total con horas extra
CREATE OR REPLACE FUNCTION calculate_item_total_with_extra_hours(
    base_price DECIMAL(10,2),
    quantity INTEGER,
    extra_hours INTEGER,
    extra_hour_percentage DECIMAL(5,2)
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    extra_cost DECIMAL(10,2);
    total DECIMAL(10,2);
BEGIN
    -- Calcular costo de horas extra
    extra_cost := (base_price * extra_hour_percentage / 100) * extra_hours;
    
    -- Calcular total: (precio base + costo horas extra) * cantidad
    total := (base_price + extra_cost) * quantity;
    
    RETURN ROUND(total, 2);
END;
$$;

-- 5. Crear función para calcular el subtotal de una reserva
CREATE OR REPLACE FUNCTION calculate_reservation_subtotal(reservation_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    subtotal DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(item_total), 0)
    INTO subtotal
    FROM public.reservation_items
    WHERE reservation_id = reservation_uuid;
    
    RETURN subtotal;
END;
$$;

-- 6. Crear trigger para actualizar automáticamente el subtotal cuando cambien los items
CREATE OR REPLACE FUNCTION update_reservation_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Actualizar subtotal de la reserva
    UPDATE public.reservations 
    SET subtotal = calculate_reservation_subtotal(NEW.reservation_id)
    WHERE id = NEW.reservation_id;
    
    RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS update_reservation_subtotal_trigger ON public.reservation_items;

-- Crear nuevo trigger
CREATE TRIGGER update_reservation_subtotal_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reservation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_reservation_subtotal();

-- 7. Crear trigger para calcular automáticamente el item_total
CREATE OR REPLACE FUNCTION calculate_item_total_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calcular el total del item incluyendo horas extra
    NEW.item_total := calculate_item_total_with_extra_hours(
        NEW.product_price,
        NEW.quantity,
        NEW.extra_hours,
        NEW.extra_hour_percentage
    );
    
    RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS calculate_item_total_trigger ON public.reservation_items;

-- Crear nuevo trigger
CREATE TRIGGER calculate_item_total_trigger
    BEFORE INSERT OR UPDATE ON public.reservation_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_item_total_trigger();

-- 8. Actualizar datos existentes que puedan tener valores incorrectos
UPDATE public.reservation_items 
SET item_total = calculate_item_total_with_extra_hours(
    product_price,
    quantity,
    extra_hours,
    extra_hour_percentage
)
WHERE item_total != calculate_item_total_with_extra_hours(
    product_price,
    quantity,
    extra_hours,
    extra_hour_percentage
);

-- 9. Actualizar subtotales de reservas existentes
UPDATE public.reservations 
SET subtotal = calculate_reservation_subtotal(id)
WHERE subtotal != calculate_reservation_subtotal(id);

-- 10. Crear índices para mejorar rendimiento en consultas con extra_hours
CREATE INDEX IF NOT EXISTS idx_reservation_items_extra_hours 
ON public.reservation_items(extra_hours);

CREATE INDEX IF NOT EXISTS idx_reservations_extra_hours 
ON public.reservations(extra_hours);

-- 11. Crear vista para facilitar consultas de reservas con detalles de horas extra
CREATE OR REPLACE VIEW reservation_details_with_extra_hours AS
SELECT 
    r.id,
    r.user_id,
    r.event_date,
    r.event_time,
    r.event_address,
    r.zone_id,
    r.phone,
    r.adult_count,
    r.child_count,
    r.comments,
    r.rain_reschedule,
    r.extra_hours,
    r.subtotal,
    r.transport_cost,
    r.total,
    r.status,
    r.payment_proof_url,
    r.created_at,
    r.updated_at,
    z.name as zone_name,
    z.transport_cost as zone_transport_cost,
    p.first_name,
    p.last_name,
    p.phone as user_phone,
    COUNT(ri.id) as total_items,
    SUM(ri.extra_hours) as total_extra_hours,
    SUM(ri.extra_hours * ri.extra_hour_percentage * ri.product_price / 100) as total_extra_hours_cost
FROM public.reservations r
LEFT JOIN public.zones z ON r.zone_id = z.id
LEFT JOIN public.profiles p ON r.user_id = p.user_id
LEFT JOIN public.reservation_items ri ON r.id = ri.reservation_id
GROUP BY r.id, z.name, z.transport_cost, p.first_name, p.last_name, p.phone;

-- 12. Verificar que todo se aplicó correctamente
DO $$
DECLARE
    reservation_count INTEGER;
    item_count INTEGER;
    extra_hours_count INTEGER;
BEGIN
    -- Verificar que el campo extra_hours existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'extra_hours'
    ) THEN
        RAISE EXCEPTION '❌ El campo extra_hours no existe en la tabla reservations';
    END IF;
    
    -- Verificar que las funciones existen
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_item_total_with_extra_hours') THEN
        RAISE EXCEPTION '❌ La función calculate_item_total_with_extra_hours no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_reservation_subtotal') THEN
        RAISE EXCEPTION '❌ La función calculate_reservation_subtotal no existe';
    END IF;
    
    -- Contar registros para verificar integridad
    SELECT COUNT(*) INTO reservation_count FROM public.reservations;
    SELECT COUNT(*) INTO item_count FROM public.reservation_items;
    SELECT COUNT(*) INTO extra_hours_count FROM public.reservation_items WHERE extra_hours > 0;
    
    RAISE NOTICE '✅ Migración completada exitosamente:';
    RAISE NOTICE '   - Reservas totales: %', reservation_count;
    RAISE NOTICE '   - Items de reserva totales: %', item_count;
    RAISE NOTICE '   - Items con horas extra: %', extra_hours_count;
    RAISE NOTICE '   - Campo extra_hours agregado y validado';
    RAISE NOTICE '   - Funciones de cálculo creadas';
    RAISE NOTICE '   - Triggers configurados';
    RAISE NOTICE '   - Índices optimizados';
    RAISE NOTICE '   - Vista de detalles creada';
    
END $$; 