-- Script para debuggear problemas relacionados con hook.js
-- Este script verifica posibles problemas en la base de datos que puedan causar errores en React

-- 1. Verificar el estado de las tablas principales
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reservations', 'reservation_items', 'user_roles', 'profiles', 'products', 'cart_items')
ORDER BY tablename;

-- 2. Verificar si hay locks activos que puedan estar causando problemas
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%'
AND query NOT LIKE '%pg_tables%';

-- 3. Verificar el estado de las funciones RPC
SELECT 
    routine_name,
    routine_type,
    data_type,
    is_deterministic,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%admin%'
ORDER BY routine_name;

-- 4. Verificar si hay errores en los logs de la base de datos
-- (Esto requiere acceso a los logs del servidor)

-- 5. Verificar el estado de las políticas RLS
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Verificar el estado de las secuencias
SELECT 
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment,
    cycle_option
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- 7. Verificar el estado de los triggers
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name; 