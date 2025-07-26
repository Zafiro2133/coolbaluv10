-- =====================================================
-- MIGRACIÓN: Limpieza de datos innecesarios en Supabase
-- Fecha: 2025-01-17
-- =====================================================

-- Limpiar datos de prueba o innecesarios de availabilities
-- Eliminar disponibilidades de fechas pasadas (más de 30 días)
DELETE FROM public.availabilities 
WHERE date < CURRENT_DATE - INTERVAL '30 days';

-- Limpiar datos de contact_messages (mensajes muy antiguos)
-- Mantener solo los últimos 6 meses
DELETE FROM public.contact_messages 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';

-- Limpiar logs de debug o datos temporales si existen
-- (Comentado por seguridad - descomenta si necesitas limpiar logs específicos)
-- DELETE FROM public.debug_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

-- Limpiar reservaciones canceladas o muy antiguas (más de 1 año)
-- Mantener solo las reservaciones activas y recientes
DELETE FROM public.reservations 
WHERE status = 'cancelled' 
AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';

-- Limpiar datos de usuarios inactivos (sin actividad en 6 meses)
-- Solo para usuarios que no son admin
DELETE FROM auth.users 
WHERE last_sign_in_at < CURRENT_TIMESTAMP - INTERVAL '6 months'
AND id NOT IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
);

-- Limpiar datos de productos descontinuados o sin stock
-- (Comentado por seguridad - descomenta si necesitas limpiar productos específicos)
-- DELETE FROM public.products WHERE status = 'discontinued' AND updated_at < CURRENT_TIMESTAMP - INTERVAL '3 months';

-- Verificar el estado de las tablas después de la limpieza
SELECT 
    'availabilities' as table_name,
    COUNT(*) as record_count
FROM public.availabilities
UNION ALL
SELECT 
    'contact_messages' as table_name,
    COUNT(*) as record_count
FROM public.contact_messages
UNION ALL
SELECT 
    'reservations' as table_name,
    COUNT(*) as record_count
FROM public.reservations
UNION ALL
SELECT 
    'user_roles' as table_name,
    COUNT(*) as record_count
FROM public.user_roles
ORDER BY table_name; 