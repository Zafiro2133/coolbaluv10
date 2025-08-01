-- Script simplificado para dar permisos de administrador a pauhannie@gmail.com
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================================
-- PASO 1: Verificar estado actual
-- ============================================================================

SELECT 'ESTADO ACTUAL DEL USUARIO' as section;

SELECT 
    u.email,
    CASE WHEN p.id IS NOT NULL THEN 'TIENE PERFIL' ELSE 'SIN PERFIL' END as perfil_status,
    ur.role as rol_actual
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'pauhannie@gmail.com';

-- ============================================================================
-- PASO 2: Crear perfil si no existe
-- ============================================================================

INSERT INTO profiles (user_id, first_name, last_name, created_at, updated_at)
SELECT 
    u.id,
    'Pauhannie' as first_name,
    'Administrador' as last_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE u.email = 'pauhannie@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id);

-- ============================================================================
-- PASO 3: Dar permisos de administrador
-- ============================================================================

-- Crear rol de administrador si no existe
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    u.id,
    'admin' as role,
    NOW() as created_at
FROM auth.users u
WHERE u.email = 'pauhannie@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id
  );

-- Actualizar rol existente a administrador si es necesario
UPDATE user_roles 
SET role = 'admin', 
    created_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'pauhannie@gmail.com'
)
AND role != 'admin';

-- ============================================================================
-- PASO 4: Crear perfiles para otros usuarios sin perfil
-- ============================================================================

INSERT INTO profiles (user_id, first_name, last_name, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(SPLIT_PART(u.email, '@', 1), 'Usuario') as first_name,
    'Cliente' as last_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.id IS NULL
  AND u.email != 'pauhannie@gmail.com';

-- ============================================================================
-- PASO 5: Crear roles para usuarios sin rol
-- ============================================================================

INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    u.id,
    'customer' as role,
    NOW() as created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL
  AND u.email != 'pauhannie@gmail.com';

-- ============================================================================
-- PASO 6: Verificar resultado final
-- ============================================================================

SELECT 'VERIFICACION FINAL' as section;

SELECT 
    u.email,
    CASE WHEN p.id IS NOT NULL THEN 'TIENE PERFIL' ELSE 'SIN PERFIL' END as perfil_status,
    ur.role as rol_actual,
    CASE WHEN ur.role = 'admin' THEN 'ES ADMIN' ELSE 'NO ES ADMIN' END as admin_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'pauhannie@gmail.com';

-- ============================================================================
-- PASO 7: Resumen general
-- ============================================================================

SELECT 'RESUMEN GENERAL' as section;

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
    'Administradores' as metric,
    COUNT(*) as value
FROM user_roles
WHERE role = 'admin'

UNION ALL

SELECT 
    'Clientes' as metric,
    COUNT(*) as value
FROM user_roles
WHERE role = 'customer';

-- ============================================================================
-- PASO 8: Listar todos los usuarios
-- ============================================================================

SELECT 'LISTA DE USUARIOS' as section;

SELECT 
    u.email,
    p.first_name,
    p.last_name,
    ur.role,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC; 