-- =====================================================
-- MIGRACIÓN: Corregir problema con trigger de reservation_items
-- Fecha: 2025-01-25
-- Problema: Error "record 'new' has no field 'total_price'" al insertar reservation_items
-- =====================================================

-- 1. Eliminar triggers problemáticos
DROP TRIGGER IF EXISTS calculate_item_total_trigger ON public.reservation_items;
DROP TRIGGER IF EXISTS update_reservation_subtotal_trigger ON public.reservation_items;

-- 2. Eliminar funciones problemáticas
DROP FUNCTION IF EXISTS calculate_item_total_trigger();
DROP FUNCTION IF EXISTS update_reservation_subtotal();

-- 3. Verificar que la función calculate_item_total_with_extra_hours existe y funciona correctamente
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

-- 4. Crear función para calcular el subtotal de una reserva
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

-- 5. Crear trigger simplificado para calcular item_total (solo si no se proporciona)
CREATE OR REPLACE FUNCTION calculate_item_total_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Solo calcular si item_total es NULL o 0
    IF NEW.item_total IS NULL OR NEW.item_total = 0 THEN
        NEW.item_total := calculate_item_total_with_extra_hours(
            NEW.product_price,
            NEW.quantity,
            NEW.extra_hours,
            NEW.extra_hour_percentage
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 6. Crear trigger para actualizar subtotal de la reserva
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

-- 7. Crear triggers de forma segura
CREATE TRIGGER calculate_item_total_trigger
    BEFORE INSERT OR UPDATE ON public.reservation_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_item_total_trigger();

CREATE TRIGGER update_reservation_subtotal_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reservation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_reservation_subtotal();

-- 8. Verificar que la tabla reservation_items tiene la estructura correcta
DO $$
BEGIN
    -- Verificar que el campo item_total existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation_items' 
        AND column_name = 'item_total'
    ) THEN
        RAISE EXCEPTION '❌ El campo item_total no existe en la tabla reservation_items';
    END IF;
    
    -- Verificar que el campo total_price NO existe (para evitar confusiones)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation_items' 
        AND column_name = 'total_price'
    ) THEN
        RAISE EXCEPTION '❌ El campo total_price existe en reservation_items y debe ser eliminado';
    END IF;
    
    RAISE NOTICE '✅ Estructura de reservation_items verificada correctamente';
END $$;

-- 9. Actualizar datos existentes que puedan tener valores incorrectos
UPDATE public.reservation_items 
SET item_total = calculate_item_total_with_extra_hours(
    product_price,
    quantity,
    extra_hours,
    extra_hour_percentage
)
WHERE item_total IS NULL OR item_total = 0;

-- 10. Verificar que las funciones se crearon correctamente
DO $$
BEGIN
    -- Verificar que las funciones existen
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_item_total_with_extra_hours') THEN
        RAISE EXCEPTION '❌ La función calculate_item_total_with_extra_hours no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_item_total_trigger') THEN
        RAISE EXCEPTION '❌ La función calculate_item_total_trigger no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_reservation_subtotal') THEN
        RAISE EXCEPTION '❌ La función update_reservation_subtotal no existe';
    END IF;
    
    -- Verificar que los triggers existen
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'calculate_item_total_trigger' 
        AND tgrelid = 'public.reservation_items'::regclass
    ) THEN
        RAISE EXCEPTION '❌ El trigger calculate_item_total_trigger no existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_reservation_subtotal_trigger' 
        AND tgrelid = 'public.reservation_items'::regclass
    ) THEN
        RAISE EXCEPTION '❌ El trigger update_reservation_subtotal_trigger no existe';
    END IF;
    
    RAISE NOTICE '✅ Funciones y triggers verificados correctamente';
    RAISE NOTICE '✅ Migración completada: Problema con reservation_items corregido';
END $$; 