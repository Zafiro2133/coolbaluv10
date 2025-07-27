-- =====================================================
-- SCRIPT: Verificar integración del campo extra_hours
-- Fecha: 2025-01-21
-- Propósito: Verificar que todo funciona correctamente después de la migración
-- =====================================================

-- 1. Verificar estructura de tablas
SELECT 
    'reservations' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('extra_hours', 'subtotal', 'total', 'transport_cost')
ORDER BY column_name;

SELECT 
    'reservation_items' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservation_items' 
AND column_name IN ('extra_hours', 'extra_hour_percentage', 'item_total', 'quantity', 'product_price')
ORDER BY column_name;

-- 2. Verificar constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('reservations', 'reservation_items')
AND cc.column_name LIKE '%extra_hours%'
ORDER BY tc.table_name, tc.constraint_name;

-- 3. Verificar funciones
SELECT 
    proname as function_name,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN (
    'calculate_item_total_with_extra_hours',
    'calculate_reservation_subtotal',
    'update_reservation_subtotal',
    'calculate_item_total_trigger'
)
ORDER BY proname;

-- 4. Verificar triggers
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('reservations', 'reservation_items')
AND t.tgname LIKE '%extra_hours%' OR t.tgname LIKE '%subtotal%' OR t.tgname LIKE '%total%'
ORDER BY c.relname, t.tgname;

-- 5. Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('reservations', 'reservation_items')
AND (indexname LIKE '%extra_hours%' OR indexname LIKE '%subtotal%' OR indexname LIKE '%total%')
ORDER BY tablename, indexname;

-- 6. Verificar datos existentes
SELECT 
    'reservations' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN extra_hours > 0 THEN 1 END) as records_with_extra_hours,
    AVG(extra_hours) as avg_extra_hours,
    MAX(extra_hours) as max_extra_hours
FROM public.reservations;

SELECT 
    'reservation_items' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN extra_hours > 0 THEN 1 END) as records_with_extra_hours,
    AVG(extra_hours) as avg_extra_hours,
    MAX(extra_hours) as max_extra_hours,
    AVG(extra_hour_percentage) as avg_extra_hour_percentage
FROM public.reservation_items;

-- 7. Verificar cálculos de totales
SELECT 
    'reservation_items' as table_name,
    COUNT(*) as total_items,
    COUNT(CASE WHEN item_total != calculate_item_total_with_extra_hours(
        product_price, quantity, extra_hours, extra_hour_percentage
    ) THEN 1 END) as items_with_incorrect_total
FROM public.reservation_items;

SELECT 
    'reservations' as table_name,
    COUNT(*) as total_reservations,
    COUNT(CASE WHEN subtotal != calculate_reservation_subtotal(id) THEN 1 END) as reservations_with_incorrect_subtotal
FROM public.reservations;

-- 8. Verificar vista
SELECT 
    COUNT(*) as total_records_in_view,
    COUNT(CASE WHEN total_extra_hours > 0 THEN 1 END) as records_with_extra_hours
FROM reservation_details_with_extra_hours;

-- 9. Prueba de inserción de datos de ejemplo
DO $$
DECLARE
    test_reservation_id UUID;
    test_item_id UUID;
    test_product_id UUID;
BEGIN
    -- Obtener un producto de ejemplo
    SELECT id INTO test_product_id FROM public.products LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE '⚠️ No hay productos disponibles para la prueba';
        RETURN;
    END IF;
    
    -- Crear una reserva de prueba
    INSERT INTO public.reservations (
        user_id,
        event_date,
        event_time,
        event_address,
        phone,
        adult_count,
        child_count,
        extra_hours,
        subtotal,
        transport_cost,
        total,
        status
    ) VALUES (
        (SELECT id FROM auth.users LIMIT 1),
        CURRENT_DATE + INTERVAL '7 days',
        '14:00:00',
        'Dirección de prueba',
        '1234567890',
        2,
        1,
        2, -- 2 horas extra
        0,
        0,
        0,
        'pending_payment'
    ) RETURNING id INTO test_reservation_id;
    
    -- Crear un item de reserva de prueba
    INSERT INTO public.reservation_items (
        reservation_id,
        product_id,
        product_name,
        product_price,
        quantity,
        extra_hours,
        extra_hour_percentage,
        item_total
    ) VALUES (
        test_reservation_id,
        test_product_id,
        'Producto de prueba',
        1000.00,
        1,
        2, -- 2 horas extra
        15.00, -- 15% por hora extra
        0 -- Se calculará automáticamente
    ) RETURNING id INTO test_item_id;
    
    RAISE NOTICE '✅ Prueba de inserción exitosa:';
    RAISE NOTICE '   - Reserva creada: %', test_reservation_id;
    RAISE NOTICE '   - Item creado: %', test_item_id;
    
    -- Verificar que los cálculos funcionan
    SELECT item_total INTO test_item_id FROM public.reservation_items WHERE id = test_item_id;
    RAISE NOTICE '   - Total del item calculado: %', test_item_id;
    
    -- Limpiar datos de prueba
    DELETE FROM public.reservation_items WHERE reservation_id = test_reservation_id;
    DELETE FROM public.reservations WHERE id = test_reservation_id;
    
    RAISE NOTICE '   - Datos de prueba eliminados';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en la prueba: %', SQLERRM;
END $$;

-- 10. Resumen final
DO $$
DECLARE
    reservation_count INTEGER;
    item_count INTEGER;
    extra_hours_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO reservation_count FROM public.reservations;
    SELECT COUNT(*) INTO item_count FROM public.reservation_items;
    SELECT COUNT(*) INTO extra_hours_count FROM public.reservation_items WHERE extra_hours > 0;
    SELECT COUNT(*) INTO function_count FROM pg_proc WHERE proname LIKE '%extra_hours%' OR proname LIKE '%subtotal%';
    SELECT COUNT(*) INTO trigger_count FROM pg_trigger WHERE tgname LIKE '%extra_hours%' OR tgname LIKE '%subtotal%' OR tgname LIKE '%total%';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE indexname LIKE '%extra_hours%' OR indexname LIKE '%subtotal%' OR indexname LIKE '%total%';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE VERIFICACIÓN DE EXTRA_HOURS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Datos:';
    RAISE NOTICE '   - Reservas totales: %', reservation_count;
    RAISE NOTICE '   - Items de reserva: %', item_count;
    RAISE NOTICE '   - Items con horas extra: %', extra_hours_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Funciones y triggers:';
    RAISE NOTICE '   - Funciones relacionadas: %', function_count;
    RAISE NOTICE '   - Triggers configurados: %', trigger_count;
    RAISE NOTICE '   - Índices optimizados: %', index_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verificación completada';
    RAISE NOTICE '========================================';
END $$; 