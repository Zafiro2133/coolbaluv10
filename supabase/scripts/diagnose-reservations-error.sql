-- Script para diagnosticar el error 400 en consultas de reservas
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar si las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('reservations', 'profiles', 'reservation_items')
ORDER BY table_name;

-- 2. Verificar estructura de la tabla reservations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

-- 3. Verificar foreign keys existentes
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'reservations'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Verificar si hay datos en las tablas
SELECT 
    'reservations' as table_name,
    COUNT(*) as row_count
FROM reservations
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM profiles
UNION ALL
SELECT 
    'reservation_items' as table_name,
    COUNT(*) as row_count
FROM reservation_items;

-- 5. Probar consulta simple sin JOIN
SELECT 
    id,
    user_id,
    event_date,
    status,
    created_at
FROM reservations 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Probar JOIN manual
SELECT 
    r.id,
    r.user_id,
    r.event_date,
    r.status,
    p.first_name,
    p.last_name
FROM reservations r
LEFT JOIN profiles p ON r.user_id = p.user_id
ORDER BY r.created_at DESC 
LIMIT 5;

-- 7. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('reservations', 'profiles', 'reservation_items')
ORDER BY tablename, policyname;

-- 8. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('reservations', 'profiles', 'reservation_items'); 