-- Script de diagnóstico para problemas de administración
-- Ejecutar manualmente en Supabase SQL Editor

-- 1. Verificar si RLS está habilitado en las tablas importantes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'reservations', 'audit_logs', 'profiles');

-- 2. Verificar políticas existentes en user_roles
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
WHERE tablename = 'user_roles';

-- 3. Verificar si existen usuarios admin
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.created_at,
    au.email,
    p.first_name,
    p.last_name
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN public.profiles p ON ur.user_id = p.user_id
WHERE ur.role = 'admin';

-- 4. Verificar funciones RPC existentes
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_reservation_history',
    'revert_reservation_status',
    'set_admin_context'
);

-- 5. Verificar triggers en la tabla reservations
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reservations';

-- 6. Verificar estructura de la tabla audit_logs
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 7. Verificar estructura de la tabla user_roles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 8. Verificar permisos de las funciones
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_reservation_history',
    'revert_reservation_status',
    'set_admin_context'
); 