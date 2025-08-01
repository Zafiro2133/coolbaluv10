-- Script para crear perfiles faltantes para usuarios que no los tienen
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================================
-- PASO 1: Verificar usuarios sin perfil
-- ============================================================================

SELECT 
    '🔍 USUARIOS SIN PERFIL' as section,
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
-- PASO 2: Crear perfiles faltantes
-- ============================================================================

-- Crear perfil para holafresatienda@gmail.com si no existe
INSERT INTO profiles (user_id, first_name, last_name, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(SPLIT_PART(u.email, '@', 1), 'Usuario') as first_name,
    'Cliente' as last_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'holafresatienda@gmail.com'
  AND p.id IS NULL;

-- Crear perfiles para todos los usuarios que no los tienen
INSERT INTO profiles (user_id, first_name, last_name, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(SPLIT_PART(u.email, '@', 1), 'Usuario') as first_name,
    'Cliente' as last_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.id IS NULL;

-- ============================================================================
-- PASO 3: Verificar usuarios sin rol
-- ============================================================================

SELECT 
    '🛡️ USUARIOS SIN ROL' as section,
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
-- PASO 4: Crear roles faltantes
-- ============================================================================

-- Crear rol para holafresatienda@gmail.com si no existe
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    u.id,
    'customer' as role,
    NOW() as created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'holafresatienda@gmail.com'
  AND ur.id IS NULL;

-- Crear roles para todos los usuarios que no los tienen
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    u.id,
    'customer' as role,
    NOW() as created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL;

-- ============================================================================
-- PASO 5: Verificar que se crearon correctamente
-- ============================================================================

SELECT 
    '✅ VERIFICACIÓN FINAL' as section,
    '' as info;

-- Verificar que el usuario específico ahora tiene perfil y rol
SELECT 
    'holafresatienda@gmail.com' as email,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p 
            JOIN auth.users u ON p.user_id = u.id 
            WHERE u.email = 'holafresatienda@gmail.com'
        ) 
        THEN '✅ TIENE PERFIL' 
        ELSE '❌ SIN PERFIL' 
    END as perfil_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN auth.users u ON ur.user_id = u.id 
            WHERE u.email = 'holafresatienda@gmail.com'
        ) 
        THEN '✅ TIENE ROL' 
        ELSE '❌ SIN ROL' 
    END as rol_status;

-- ============================================================================
-- PASO 6: Información completa del usuario después de la corrección
-- ============================================================================

SELECT 
    '📋 INFORMACIÓN COMPLETA DEL USUARIO' as section,
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
-- PASO 7: Resumen final
-- ============================================================================

SELECT 
    '📊 RESUMEN FINAL' as section,
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