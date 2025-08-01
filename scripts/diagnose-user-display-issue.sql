-- Script para diagnosticar por qué no se muestran todos los usuarios en el panel de administración
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================================
-- PASO 1: Verificar todos los usuarios en auth.users
-- ============================================================================

SELECT 
    '🔍 TODOS LOS USUARIOS EN AUTH.USERS' as section,
    '' as info;

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN last_sign_in_at IS NULL THEN 'Nunca inició sesión'
        ELSE 'Último acceso: ' || last_sign_in_at::date
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: Verificar perfiles de usuarios
-- ============================================================================

SELECT 
    '👤 PERFILES DE USUARIOS' as section,
    '' as info;

SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.phone,
    p.address,
    p.created_at,
    u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- ============================================================================
-- PASO 3: Verificar roles de usuarios
-- ============================================================================

SELECT 
    '🛡️ ROLES DE USUARIOS' as section,
    '' as info;

SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.created_at,
    u.email
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.created_at DESC;

-- ============================================================================
-- PASO 4: Verificar usuarios sin perfiles
-- ============================================================================

SELECT 
    '❌ USUARIOS SIN PERFIL' as section,
    '' as info;

SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.id IS NULL;

-- ============================================================================
-- PASO 5: Verificar usuarios sin roles
-- ============================================================================

SELECT 
    '❌ USUARIOS SIN ROL' as section,
    '' as info;

SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL;

-- ============================================================================
-- PASO 6: Verificar el usuario específico holafresatienda@gmail.com
-- ============================================================================

SELECT 
    '🎯 USUARIO ESPECÍFICO: holafresatienda@gmail.com' as section,
    '' as info;

-- Verificar si existe en auth.users
SELECT 
    'auth.users' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'holafresatienda@gmail.com') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status;

-- Verificar si tiene perfil
SELECT 
    'profiles' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p 
            JOIN auth.users u ON p.user_id = u.id 
            WHERE u.email = 'holafresatienda@gmail.com'
        ) 
        THEN '✅ TIENE PERFIL' 
        ELSE '❌ SIN PERFIL' 
    END as status;

-- Verificar si tiene rol
SELECT 
    'user_roles' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN auth.users u ON ur.user_id = u.id 
            WHERE u.email = 'holafresatienda@gmail.com'
        ) 
        THEN '✅ TIENE ROL' 
        ELSE '❌ SIN ROL' 
    END as status;

-- ============================================================================
-- PASO 7: Información detallada del usuario específico
-- ============================================================================

SELECT 
    '📋 INFORMACIÓN DETALLADA DEL USUARIO' as section,
    '' as info;

SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    p.first_name,
    p.last_name,
    p.phone,
    p.address,
    ur.role,
    COUNT(r.id) as total_reservations,
    COALESCE(SUM(r.total), 0) as total_spent
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN reservations r ON u.id = r.user_id
WHERE u.email = 'holafresatienda@gmail.com'
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, p.first_name, p.last_name, p.phone, p.address, ur.role;

-- ============================================================================
-- PASO 8: Verificar políticas RLS que puedan estar afectando
-- ============================================================================

SELECT 
    '🔒 POLÍTICAS RLS EN PROFILES' as section,
    '' as info;

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
WHERE tablename = 'profiles';

-- ============================================================================
-- PASO 9: Verificar permisos del usuario actual
-- ============================================================================

SELECT 
    '👤 USUARIO ACTUAL Y PERMISOS' as section,
    '' as info;

SELECT 
    current_user as usuario_actual,
    session_user as usuario_sesion,
    current_database() as base_datos_actual;

-- ============================================================================
-- PASO 10: Resumen del diagnóstico
-- ============================================================================

SELECT 
    '📊 RESUMEN DEL DIAGNÓSTICO' as section,
    '' as info;

SELECT 
    'Total usuarios en auth.users' as metric,
    COUNT(*) as value
FROM auth.users

UNION ALL

SELECT 
    'Usuarios con perfil' as metric,
    COUNT(*) as value
FROM profiles

UNION ALL

SELECT 
    'Usuarios con rol' as metric,
    COUNT(*) as value
FROM user_roles

UNION ALL

SELECT 
    'Usuarios sin perfil' as metric,
    COUNT(*) as value
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'Usuarios sin rol' as metric,
    COUNT(*) as value
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL; 