-- Script de Verificación: Eliminación de Usuarios en Supabase
-- Ejecuta este script en el SQL Editor de Supabase para verificar la configuración

-- ============================================================================
-- PASO 1: Verificar el estado de las Foreign Keys
-- ============================================================================

SELECT 
    '🔍 VERIFICACIÓN DE FOREIGN KEYS' as section,
    '' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ PERMITE ELIMINACIÓN'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ SET NULL'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOQUEA ELIMINACIÓN'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ BLOQUEA ELIMINACIÓN'
        ELSE '❓ DESCONOCIDO'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.referenced_table_name = 'users'
    AND kcu.referenced_table_schema = 'auth'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- PASO 2: Verificar que las tablas principales tengan CASCADE
-- ============================================================================

SELECT 
    '🔧 VERIFICACIÓN DE TABLAS PRINCIPALES' as section,
    '' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CORRECTO'
        ELSE '❌ NECESITA CORRECCIÓN'
    END as status,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN 'La tabla se limpiará automáticamente'
        ELSE 'Esta tabla puede bloquear la eliminación de usuarios'
    END as description
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('profiles', 'user_roles', 'reservations', 'reservation_items', 'audit_log')
    AND tc.constraint_name LIKE '%user_id%'
ORDER BY tc.table_name;

-- ============================================================================
-- PASO 3: Verificar datos de usuarios
-- ============================================================================

SELECT 
    '👥 ESTADÍSTICAS DE USUARIOS' as section,
    '' as info;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_sign_in_at IS NULL THEN 1 END) as never_logged_in,
    COUNT(CASE WHEN last_sign_in_at < NOW() - INTERVAL '30 days' THEN 1 END) as inactive_30_days,
    COUNT(CASE WHEN last_sign_in_at < NOW() - INTERVAL '90 days' THEN 1 END) as inactive_90_days
FROM auth.users;

-- ============================================================================
-- PASO 4: Verificar integridad de datos
-- ============================================================================

SELECT 
    '🔍 VERIFICACIÓN DE INTEGRIDAD' as section,
    '' as info;

-- Verificar datos huérfanos
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
-- PASO 5: Verificar usuarios con más actividad
-- ============================================================================

SELECT 
    '📊 USUARIOS CON MÁS ACTIVIDAD' as section,
    '' as info;

SELECT 
    u.email,
    p.first_name,
    p.last_name,
    COUNT(r.id) as total_reservations,
    COALESCE(SUM(r.total), 0) as total_spent,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN reservations r ON u.id = r.user_id
GROUP BY u.id, u.email, p.first_name, p.last_name, u.created_at, u.last_sign_in_at
HAVING COUNT(r.id) > 0
ORDER BY total_reservations DESC, total_spent DESC
LIMIT 10;

-- ============================================================================
-- PASO 6: Verificar usuarios inactivos
-- ============================================================================

SELECT 
    '⏰ USUARIOS INACTIVOS' as section,
    '' as info;

SELECT 
    u.email,
    p.first_name,
    p.last_name,
    u.created_at,
    u.last_sign_in_at,
    CASE 
        WHEN u.last_sign_in_at IS NULL THEN 'Nunca inició sesión'
        ELSE 'Inactivo desde ' || u.last_sign_in_at::date
    END as status,
    COUNT(r.id) as total_reservations
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN reservations r ON u.id = r.user_id
WHERE u.last_sign_in_at < NOW() - INTERVAL '30 days'
   OR u.last_sign_in_at IS NULL
GROUP BY u.id, u.email, p.first_name, p.last_name, u.created_at, u.last_sign_in_at
ORDER BY u.last_sign_in_at ASC NULLS FIRST
LIMIT 10;

-- ============================================================================
-- PASO 7: Resumen de verificación
-- ============================================================================

SELECT 
    '📋 RESUMEN DE VERIFICACIÓN' as section,
    '' as info;

-- Contar tablas con CASCADE configurado
SELECT 
    'Tablas con CASCADE configurado' as metric,
    COUNT(*) as value
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('profiles', 'user_roles', 'reservations', 'reservation_items', 'audit_log')
    AND tc.constraint_name LIKE '%user_id%'
    AND rc.delete_rule = 'CASCADE'

UNION ALL

-- Contar tablas que necesitan corrección
SELECT 
    'Tablas que necesitan corrección' as metric,
    COUNT(*) as value
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('profiles', 'user_roles', 'reservations', 'reservation_items', 'audit_log')
    AND tc.constraint_name LIKE '%user_id%'
    AND rc.delete_rule != 'CASCADE'

UNION ALL

-- Contar datos huérfanos
SELECT 
    'Total datos huérfanos' as metric,
    (
        SELECT COUNT(*) FROM profiles p LEFT JOIN auth.users u ON p.user_id = u.id WHERE u.id IS NULL
    ) + (
        SELECT COUNT(*) FROM user_roles ur LEFT JOIN auth.users u ON ur.user_id = u.id WHERE u.id IS NULL
    ) + (
        SELECT COUNT(*) FROM reservations r LEFT JOIN auth.users u ON r.user_id = u.id WHERE u.id IS NULL
    ) as value;

-- ============================================================================
-- INSTRUCCIONES FINALES
-- ============================================================================

SELECT 
    '🎯 INSTRUCCIONES' as section,
    '' as info;

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc 
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name IN ('profiles', 'user_roles', 'reservations', 'reservation_items', 'audit_log')
                AND tc.constraint_name LIKE '%user_id%'
                AND rc.delete_rule != 'CASCADE'
        ) = 0 THEN '✅ SISTEMA LISTO - Puedes eliminar usuarios sin problemas'
        ELSE '❌ SISTEMA NECESITA CORRECCIÓN - Ejecuta el script de corrección primero'
    END as status,
    
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc 
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name IN ('profiles', 'user_roles', 'reservations', 'reservation_items', 'audit_log')
                AND tc.constraint_name LIKE '%user_id%'
                AND rc.delete_rule != 'CASCADE'
        ) = 0 THEN 'Puedes proceder a eliminar usuarios desde el panel de administración'
        ELSE 'Ejecuta scripts/fix-user-deletion.sql para corregir las foreign keys'
    END as next_step; 