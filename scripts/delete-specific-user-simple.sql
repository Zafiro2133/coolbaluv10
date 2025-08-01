-- Script simplificado para eliminar el usuario holafresatienda@gmail.com
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================================
-- PASO 1: Verificar información del usuario antes de eliminar
-- ============================================================================

SELECT 'INFORMACION DEL USUARIO A ELIMINAR' as section;

SELECT 
    u.id,
    u.email,
    u.created_at,
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
GROUP BY u.id, u.email, u.created_at, p.first_name, p.last_name, ur.role;

-- ============================================================================
-- PASO 2: Verificar reservas del usuario
-- ============================================================================

SELECT 'RESERVAS DEL USUARIO' as section;

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
-- PASO 3: Eliminar datos relacionados (en orden correcto)
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
-- PASO 4: Eliminar el usuario de auth.users
-- ============================================================================

-- Eliminar el usuario
DELETE FROM auth.users 
WHERE email = 'holafresatienda@gmail.com';

-- ============================================================================
-- PASO 5: Verificar que se eliminó correctamente
-- ============================================================================

SELECT 'VERIFICACION POST-ELIMINACION' as section;

-- Verificar que el usuario ya no existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'holafresatienda@gmail.com')
        THEN 'USUARIO AUN EXISTE'
        ELSE 'USUARIO ELIMINADO'
    END as usuario_status;

-- ============================================================================
-- PASO 6: Resumen final
-- ============================================================================

SELECT 'RESUMEN FINAL' as section;

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