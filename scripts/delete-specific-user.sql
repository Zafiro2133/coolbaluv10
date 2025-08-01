-- Script para eliminar el usuario holafresatienda@gmail.com
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================================
-- PASO 1: Verificar información del usuario antes de eliminar
-- ============================================================================

SELECT 
    '🔍 INFORMACIÓN DEL USUARIO A ELIMINAR' as section,
    '' as info;

SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    p.first_name,
    p.last_name,
    ur.role,
    COUNT(r.id) as total_reservations,
    COALESCE(SUM(r.total), 0) as total_spent
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN reservations r ON u.id = r.user_id
WHERE u.email = 'holafresatienda@gmail.com'
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, p.first_name, p.last_name, ur.role;

-- ============================================================================
-- PASO 2: Verificar reservas del usuario
-- ============================================================================

SELECT 
    '📋 RESERVAS DEL USUARIO' as section,
    '' as info;

SELECT 
    r.id,
    r.event_date,
    r.event_time,
    r.total,
    r.status,
    r.created_at
FROM reservations r
JOIN auth.users u ON r.user_id = u.id
WHERE u.email = 'holafresatienda@gmail.com'
ORDER BY r.created_at DESC;

-- ============================================================================
-- PASO 3: Verificar items de reservas
-- ============================================================================

SELECT 
    '🛍️ ITEMS DE RESERVAS' as section,
    '' as info;

SELECT 
    ri.id,
    ri.reservation_id,
    ri.product_id,
    ri.quantity,
    ri.price,
    p.name as product_name
FROM reservation_items ri
JOIN reservations r ON ri.reservation_id = r.id
JOIN auth.users u ON r.user_id = u.id
LEFT JOIN products p ON ri.product_id = p.id
WHERE u.email = 'holafresatienda@gmail.com';

-- ============================================================================
-- PASO 4: Eliminar datos relacionados (en orden correcto)
-- ============================================================================

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
-- PASO 5: Eliminar el usuario de auth.users
-- ============================================================================

-- Eliminar el usuario
DELETE FROM auth.users 
WHERE email = 'holafresatienda@gmail.com';

-- ============================================================================
-- PASO 6: Verificar que se eliminó correctamente
-- ============================================================================

SELECT 
    '✅ VERIFICACIÓN POST-ELIMINACIÓN' as section,
    '' as info;

-- Verificar que el usuario ya no existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'holafresatienda@gmail.com')
        THEN '❌ USUARIO AÚN EXISTE'
        ELSE '✅ USUARIO ELIMINADO'
    END as usuario_status;

-- Verificar que no quedan datos huérfanos
SELECT 
    'profiles' as table_name,
    COUNT(*) as orphaned_records
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'user_roles' as table_name,
    COUNT(*) as orphaned_records
FROM user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'reservations' as table_name,
    COUNT(*) as orphaned_records
FROM reservations r
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'reservation_items' as table_name,
    COUNT(*) as orphaned_records
FROM reservation_items ri
LEFT JOIN reservations r ON ri.reservation_id = r.id
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE u.id IS NULL;

-- ============================================================================
-- PASO 7: Resumen final
-- ============================================================================

SELECT 
    '📊 RESUMEN FINAL' as section,
    '' as info;

SELECT 
    'Total usuarios restantes' as metric,
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
    'Reservas totales' as metric,
    COUNT(*) as value
FROM reservations; 