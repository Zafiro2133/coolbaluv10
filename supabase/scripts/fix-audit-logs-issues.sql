-- Script para diagnosticar y arreglar problemas con audit_logs
-- Ejecutar manualmente en Supabase SQL Editor

-- 1. Verificar si la tabla audit_logs existe y su estructura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 2. Verificar si RLS está habilitado en audit_logs
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'audit_logs';

-- 3. Verificar políticas existentes en audit_logs
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- 4. Verificar si la función get_reservation_history existe
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_reservation_history';

-- 5. Verificar si hay datos en audit_logs
SELECT COUNT(*) as total_audit_logs FROM public.audit_logs;

-- 6. Verificar si hay datos de auditoría para reservas específicas
SELECT 
    table_name,
    record_id,
    action,
    timestamp,
    description
FROM public.audit_logs 
WHERE table_name = 'reservations'
ORDER BY timestamp DESC
LIMIT 10;

-- 7. Probar la función get_reservation_history manualmente
-- (Reemplazar 'RESERVATION_ID_AQUI' con un ID real de reserva)
-- SELECT * FROM get_reservation_history('RESERVATION_ID_AQUI');

-- 8. Verificar permisos de la función
SELECT 
    routine_name,
    routine_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_reservation_history';

-- 9. Verificar si el trigger de auditoría está activo
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'reservations'
AND trigger_name = 'audit_reservations_trigger';

-- 10. Verificar si hay errores en el log de auditoría
-- (Esto puede ayudar a identificar problemas con el trigger)
SELECT 
    table_name,
    action,
    COUNT(*) as count
FROM public.audit_logs 
WHERE table_name = 'reservations'
GROUP BY table_name, action
ORDER BY count DESC; 