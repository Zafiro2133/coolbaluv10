-- =====================================================
-- SCRIPT: Limpieza segura de datos en Supabase
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Función para limpiar datos de manera segura
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(table_name text, deleted_count bigint) AS $$
DECLARE
    availabilities_deleted bigint := 0;
    contact_messages_deleted bigint := 0;
    reservations_deleted bigint := 0;
    users_deleted bigint := 0;
BEGIN
    -- Limpiar disponibilidades de fechas pasadas (más de 30 días)
    DELETE FROM public.availabilities 
    WHERE date < CURRENT_DATE - INTERVAL '30 days';
    GET DIAGNOSTICS availabilities_deleted = ROW_COUNT;
    
    -- Limpiar mensajes de contacto antiguos (más de 6 meses)
    DELETE FROM public.contact_messages 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
    GET DIAGNOSTICS contact_messages_deleted = ROW_COUNT;
    
    -- Limpiar reservaciones canceladas antiguas (más de 1 año)
    DELETE FROM public.reservations 
    WHERE status = 'cancelled' 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
    GET DIAGNOSTICS reservations_deleted = ROW_COUNT;
    
    -- Limpiar usuarios inactivos (más de 6 meses, excluyendo admins)
    DELETE FROM auth.users 
    WHERE last_sign_in_at < CURRENT_TIMESTAMP - INTERVAL '6 months'
    AND id NOT IN (
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
    );
    GET DIAGNOSTICS users_deleted = ROW_COUNT;
    
    -- Retornar resultados
    RETURN QUERY SELECT 'availabilities'::text, availabilities_deleted
    UNION ALL SELECT 'contact_messages'::text, contact_messages_deleted
    UNION ALL SELECT 'reservations'::text, reservations_deleted
    UNION ALL SELECT 'users'::text, users_deleted;
    
    RAISE NOTICE 'Limpieza completada: % disponibilidades, % mensajes, % reservaciones, % usuarios eliminados', 
        availabilities_deleted, contact_messages_deleted, reservations_deleted, users_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la limpieza
SELECT * FROM cleanup_old_data();

-- Mostrar estadísticas actuales
SELECT 
    'availabilities' as table_name,
    COUNT(*) as current_records
FROM public.availabilities
UNION ALL
SELECT 
    'contact_messages' as table_name,
    COUNT(*) as current_records
FROM public.contact_messages
UNION ALL
SELECT 
    'reservations' as table_name,
    COUNT(*) as current_records
FROM public.reservations
UNION ALL
SELECT 
    'user_roles' as table_name,
    COUNT(*) as current_records
FROM public.user_roles
ORDER BY table_name;

-- Limpiar la función después de usarla
DROP FUNCTION IF EXISTS cleanup_old_data(); 