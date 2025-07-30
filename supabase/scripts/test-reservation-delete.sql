-- Script de prueba para verificar políticas de eliminación de reservas
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd, policyname;

-- 2. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('reservations', 'reservation_items')
AND schemaname = 'public';

-- 3. Verificar función has_role
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'has_role'
AND routine_schema = 'public';

-- 4. Probar la función has_role con el usuario actual
SELECT public.has_role(auth.uid(), 'admin') as is_admin;

-- 5. Verificar permisos del usuario actual
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('reservations', 'reservation_items')
AND grantee = current_user; 