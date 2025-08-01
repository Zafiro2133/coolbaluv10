-- Script minimalista para eliminar el usuario holafresatienda@gmail.com
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================================
-- PASO 1: Verificar información del usuario
-- ============================================================================

SELECT 'VERIFICANDO USUARIO' as paso;
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.first_name,
    p.last_name,
    ur.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'holafresatienda@gmail.com';

-- ============================================================================
-- PASO 2: Verificar reservas
-- ============================================================================

SELECT 'VERIFICANDO RESERVAS' as paso;
SELECT COUNT(*) as total_reservations FROM reservations r
JOIN auth.users u ON r.user_id = u.id
WHERE u.email = 'holafresatienda@gmail.com';

-- ============================================================================
-- PASO 3: Eliminar datos relacionados
-- ============================================================================

SELECT 'ELIMINANDO DATOS' as paso;

-- Eliminar items de reservas
DELETE FROM reservation_items 
WHERE reservation_id IN (
    SELECT r.id 
    FROM reservations r 
    JOIN auth.users u ON r.user_id = u.id 
    WHERE u.email = 'holafresatienda@gmail.com'
);

-- Eliminar reservas
DELETE FROM reservations 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'holafresatienda@gmail.com'
);

-- Eliminar roles del usuario
DELETE FROM user_roles 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'holafresatienda@gmail.com'
);

-- Eliminar perfil del usuario
DELETE FROM profiles 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'holafresatienda@gmail.com'
);

-- ============================================================================
-- PASO 4: Eliminar el usuario
-- ============================================================================

SELECT 'ELIMINANDO USUARIO' as paso;
DELETE FROM auth.users 
WHERE email = 'holafresatienda@gmail.com';

-- ============================================================================
-- PASO 5: Verificar eliminación
-- ============================================================================

SELECT 'VERIFICANDO ELIMINACION' as paso;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'holafresatienda@gmail.com')
        THEN 'USUARIO AUN EXISTE'
        ELSE 'USUARIO ELIMINADO'
    END as status;

-- ============================================================================
-- PASO 6: Resumen final
-- ============================================================================

SELECT 'RESUMEN FINAL' as paso;
SELECT 'Total usuarios' as metric, COUNT(*) as value FROM auth.users
UNION ALL
SELECT 'Con perfil' as metric, COUNT(*) as value FROM profiles
UNION ALL
SELECT 'Con rol' as metric, COUNT(*) as value FROM user_roles
UNION ALL
SELECT 'Reservas' as metric, COUNT(*) as value FROM reservations; 