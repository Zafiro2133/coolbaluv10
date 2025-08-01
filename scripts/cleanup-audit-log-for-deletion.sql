-- Script para limpiar registros de audit_log que impiden la eliminación de usuarios
-- ⚠️ ADVERTENCIA: Este script elimina registros de auditoría. Úsalo con precaución.

-- Opción 1: Eliminar registros de audit_log para usuarios específicos
-- Reemplaza 'usuario@email.com' con el email del usuario que quieres eliminar
DELETE FROM public.audit_log 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'usuario@email.com'
);

-- Opción 2: Eliminar todos los registros de audit_log (NUCLEAR OPTION)
-- ⚠️ SOLO USAR SI ESTÁS SEGURO DE QUE QUIERES PERDER TODA LA AUDITORÍA
-- DELETE FROM public.audit_log;

-- Opción 3: Eliminar registros de audit_log para usuarios inactivos (más de 30 días)
DELETE FROM public.audit_log 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE last_sign_in_at < NOW() - INTERVAL '30 days'
    OR last_sign_in_at IS NULL
);

-- Opción 4: Verificar qué registros se van a eliminar antes de hacerlo
SELECT 
    al.id,
    al.table_name,
    al.action,
    al.created_at,
    u.email
FROM public.audit_log al
JOIN auth.users u ON al.user_id = u.id
WHERE u.email = 'usuario@email.com'  -- Reemplaza con el email del usuario
ORDER BY al.created_at DESC;

-- Opción 5: Contar registros por usuario antes de eliminar
SELECT 
    u.email,
    COUNT(al.id) as audit_records
FROM auth.users u
LEFT JOIN public.audit_log al ON u.id = al.user_id
GROUP BY u.id, u.email
HAVING COUNT(al.id) > 0
ORDER BY audit_records DESC; 