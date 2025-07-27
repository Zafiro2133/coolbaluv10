-- Script para aplicar la corrección completa de reservas
-- Ejecutar: psql -h db.supabase.co -U postgres -d postgres -f apply-reservations-fix.sql

-- Aplicar las migraciones de corrección
\i ../migrations/20250120000000-fix-reservations-complete.sql
\i ../migrations/20250120000001-fix-reservations-foreign-keys.sql

-- Verificar el estado final
SELECT 
    'reservations' as table_name,
    COUNT(*) as row_count
FROM public.reservations
UNION ALL
SELECT 
    'reservation_items' as table_name,
    COUNT(*) as row_count
FROM public.reservation_items;

-- Verificar políticas activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, policyname;

-- Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, indexname;

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('reservations', 'reservation_items')
ORDER BY event_object_table, trigger_name;

-- Verificar funciones
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname IN ('has_role', 'update_updated_at_column', 'calculate_reservation_total')
ORDER BY proname; 