-- =====================================================
-- SCRIPT: Rollback de cambios del campo extra_hours
-- Fecha: 2025-01-21
-- Propósito: Revertir todos los cambios relacionados con extra_hours
-- ⚠️ ADVERTENCIA: Este script eliminará datos y funcionalidad
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script eliminará:
-- 1. El campo extra_hours de las tablas
-- 2. Las funciones de cálculo
-- 3. Los triggers automáticos
-- 4. Los índices optimizados
-- 5. La vista de detalles

-- Solo ejecutar si estás seguro de querer revertir los cambios

-- 1. Eliminar vista
DROP VIEW IF EXISTS reservation_details_with_extra_hours;

-- 2. Eliminar triggers
DROP TRIGGER IF EXISTS update_reservation_subtotal_trigger ON public.reservation_items;
DROP TRIGGER IF EXISTS calculate_item_total_trigger ON public.reservation_items;

-- 3. Eliminar funciones
DROP FUNCTION IF EXISTS calculate_item_total_with_extra_hours(DECIMAL(10,2), INTEGER, INTEGER, DECIMAL(5,2));
DROP FUNCTION IF EXISTS calculate_reservation_subtotal(UUID);
DROP FUNCTION IF EXISTS update_reservation_subtotal();
DROP FUNCTION IF EXISTS calculate_item_total_trigger();

-- 4. Eliminar índices
DROP INDEX IF EXISTS idx_reservation_items_extra_hours;
DROP INDEX IF EXISTS idx_reservations_extra_hours;

-- 5. Eliminar constraints
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS check_extra_hours_reservations;
ALTER TABLE public.reservation_items DROP CONSTRAINT IF EXISTS check_extra_hours_reservation_items;

-- 6. Eliminar campo extra_hours de reservation_items
-- Primero crear tabla temporal sin el campo
CREATE TEMP TABLE temp_reservation_items AS 
SELECT 
    id,
    reservation_id,
    product_id,
    product_name,
    product_price,
    quantity,
    extra_hour_percentage,
    item_total,
    created_at
FROM public.reservation_items;

-- Eliminar tabla original
DROP TABLE public.reservation_items;

-- Recrear sin el campo extra_hours
CREATE TABLE public.reservation_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    extra_hour_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    item_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Restaurar datos
INSERT INTO public.reservation_items 
SELECT * FROM temp_reservation_items;

-- Eliminar tabla temporal
DROP TABLE temp_reservation_items;

-- 7. Eliminar campo extra_hours de reservations
ALTER TABLE public.reservations DROP COLUMN IF EXISTS extra_hours;

-- 8. Recrear triggers básicos sin funcionalidad de extra_hours
CREATE OR REPLACE FUNCTION calculate_basic_item_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calcular total básico: precio * cantidad
    NEW.item_total := NEW.product_price * NEW.quantity;
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_basic_item_total_trigger
    BEFORE INSERT OR UPDATE ON public.reservation_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_basic_item_total();

-- 9. Actualizar datos existentes con cálculos básicos
UPDATE public.reservation_items 
SET item_total = product_price * quantity
WHERE item_total != product_price * quantity;

-- 10. Recrear políticas RLS básicas
DROP POLICY IF EXISTS "Users can view their reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Users can insert reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can view all reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can insert all reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can update all reservation items" ON public.reservation_items;

CREATE POLICY "Users can view their reservation items" 
ON public.reservation_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert reservation items" 
ON public.reservation_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all reservation items" 
ON public.reservation_items 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all reservation items" 
ON public.reservation_items 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reservation items" 
ON public.reservation_items 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Verificar rollback
DO $$
DECLARE
    reservation_count INTEGER;
    item_count INTEGER;
    extra_hours_column_exists BOOLEAN;
BEGIN
    -- Verificar que el campo extra_hours ya no existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'extra_hours'
    ) INTO extra_hours_column_exists;
    
    IF extra_hours_column_exists THEN
        RAISE EXCEPTION '❌ El campo extra_hours aún existe en reservations';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation_items' 
        AND column_name = 'extra_hours'
    ) INTO extra_hours_column_exists;
    
    IF extra_hours_column_exists THEN
        RAISE EXCEPTION '❌ El campo extra_hours aún existe en reservation_items';
    END IF;
    
    -- Contar registros
    SELECT COUNT(*) INTO reservation_count FROM public.reservations;
    SELECT COUNT(*) INTO item_count FROM public.reservation_items;
    
    RAISE NOTICE '✅ Rollback completado exitosamente:';
    RAISE NOTICE '   - Campo extra_hours eliminado de ambas tablas';
    RAISE NOTICE '   - Funciones y triggers eliminados';
    RAISE NOTICE '   - Índices eliminados';
    RAISE NOTICE '   - Vista eliminada';
    RAISE NOTICE '   - Reservas restantes: %', reservation_count;
    RAISE NOTICE '   - Items restantes: %', item_count;
    RAISE NOTICE '   - Cálculos básicos restaurados';
    
END $$; 