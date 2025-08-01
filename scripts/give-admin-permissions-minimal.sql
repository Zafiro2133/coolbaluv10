-- Script minimalista para dar permisos de administrador a pauhannie@gmail.com
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================================
-- PASO 1: Verificar si el usuario existe
-- ============================================================================

SELECT 'VERIFICANDO USUARIO' as paso;
SELECT email, created_at FROM auth.users WHERE email = 'pauhannie@gmail.com';

-- ============================================================================
-- PASO 2: Crear perfil si no existe
-- ============================================================================

SELECT 'CREANDO PERFIL' as paso;
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

SELECT 'DANDO PERMISOS DE ADMIN' as paso;

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

SELECT 'CREANDO PERFILES FALTANTES' as paso;
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

SELECT 'CREANDO ROLES FALTANTES' as paso;
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
-- PASO 6: Verificar resultado
-- ============================================================================

SELECT 'VERIFICANDO RESULTADO' as paso;

-- Verificar pauhannie@gmail.com
SELECT 
    u.email,
    p.first_name,
    p.last_name,
    ur.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'pauhannie@gmail.com';

-- ============================================================================
-- PASO 7: Resumen final
-- ============================================================================

SELECT 'RESUMEN FINAL' as paso;

SELECT 'Total usuarios' as metric, COUNT(*) as value FROM auth.users
UNION ALL
SELECT 'Con perfil' as metric, COUNT(*) as value FROM profiles
UNION ALL
SELECT 'Con rol' as metric, COUNT(*) as value FROM user_roles
UNION ALL
SELECT 'Administradores' as metric, COUNT(*) as value FROM user_roles WHERE role = 'admin'
UNION ALL
SELECT 'Clientes' as metric, COUNT(*) as value FROM user_roles WHERE role = 'customer'; 