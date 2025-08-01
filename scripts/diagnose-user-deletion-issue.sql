-- Script de diagnóstico completo para problemas de eliminación de usuarios
-- Este script identifica exactamente qué está impidiendo la eliminación

-- 1. Verificar todas las foreign keys que referencian a auth.users
SELECT 
    'FOREIGN KEYS' as check_type,
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

-- 2. Verificar registros en audit_log
SELECT 
    'AUDIT_LOG RECORDS' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as records_with_user_id
FROM public.audit_log;

-- 3. Verificar usuarios con registros en audit_log
SELECT 
    'USERS WITH AUDIT LOGS' as check_type,
    u.email,
    u.id,
    COUNT(al.id) as audit_log_records
FROM auth.users u
LEFT JOIN public.audit_log al ON u.id = al.user_id
GROUP BY u.id, u.email
HAVING COUNT(al.id) > 0
ORDER BY audit_log_records DESC
LIMIT 10;

-- 4. Verificar registros en profiles
SELECT 
    'PROFILES RECORDS' as check_type,
    COUNT(*) as total_profiles
FROM public.profiles;

-- 5. Verificar registros en user_roles
SELECT 
    'USER ROLES RECORDS' as check_type,
    COUNT(*) as total_user_roles,
    role,
    COUNT(*) as count_by_role
FROM public.user_roles
GROUP BY role;

-- 6. Verificar registros en reservations
SELECT 
    'RESERVATIONS RECORDS' as check_type,
    COUNT(*) as total_reservations
FROM public.reservations;

-- 7. Verificar si hay usuarios huérfanos (sin perfil)
SELECT 
    'ORPHANED USERS' as check_type,
    u.email,
    u.id,
    CASE WHEN p.user_id IS NULL THEN '❌ SIN PERFIL' ELSE '✅ CON PERFIL' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC; 