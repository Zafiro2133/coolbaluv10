-- Script de verificación simple para la migración de audit_log
-- Este script verifica que la foreign key se configuró correctamente con CASCADE

-- Verificar que la foreign key de audit_log tiene CASCADE
SELECT 
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CORRECTO - Permite eliminación'
        ELSE '❌ PROBLEMA - No permite eliminación'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'audit_log' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name LIKE '%user_id%';

-- Verificar que la tabla audit_log existe y tiene la estructura correcta
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_log' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros en audit_log
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as records_with_user_id
FROM public.audit_log; 