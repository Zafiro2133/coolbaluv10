-- Script para verificar todas las foreign keys que referencian a auth.users
-- Este script ayuda a identificar qué tablas impiden la eliminación de usuarios

-- Verificar todas las foreign keys que referencian a auth.users
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

-- Verificar si hay registros en audit_log que podrían estar causando problemas
SELECT 
    'audit_log' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as records_with_user_id
FROM public.audit_log;

-- Verificar usuarios que tienen registros en audit_log
SELECT 
    u.email,
    u.id,
    COUNT(al.id) as audit_log_records
FROM auth.users u
LEFT JOIN public.audit_log al ON u.id = al.user_id
GROUP BY u.id, u.email
HAVING COUNT(al.id) > 0
ORDER BY audit_log_records DESC; 