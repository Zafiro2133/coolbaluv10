-- Script para generar datos de prueba en audit_logs
-- Ejecutar manualmente en Supabase SQL Editor

-- 1. Verificar que hay reservas existentes
SELECT 
    id,
    status,
    created_at,
    updated_at
FROM public.reservations 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Generar datos de auditoría de prueba para las reservas existentes
-- (Reemplazar 'RESERVATION_ID_AQUI' con IDs reales de reservas)

-- Ejemplo de inserción de datos de auditoría
INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_fields,
    admin_user_id,
    admin_user_email,
    description
) 
SELECT 
    'reservations' as table_name,
    r.id::TEXT as record_id,
    'INSERT' as action,
    NULL as old_values,
    jsonb_build_object(
        'status', r.status,
        'total', r.total,
        'event_date', r.event_date
    ) as new_values,
    ARRAY['status', 'total', 'event_date'] as changed_fields,
    ur.user_id as admin_user_id,
    au.email as admin_user_email,
    'Reserva creada inicialmente' as description
FROM public.reservations r
CROSS JOIN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'admin' 
    LIMIT 1
) ur
CROSS JOIN auth.users au
WHERE au.id = ur.user_id
AND r.id NOT IN (
    SELECT record_id::UUID 
    FROM public.audit_logs 
    WHERE table_name = 'reservations'
)
LIMIT 10;

-- 3. Generar cambios de estado de prueba
INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_fields,
    admin_user_id,
    admin_user_email,
    description
)
SELECT 
    'reservations' as table_name,
    r.id::TEXT as record_id,
    'UPDATE' as action,
    jsonb_build_object('status', 'pending_payment') as old_values,
    jsonb_build_object('status', 'confirmed') as new_values,
    ARRAY['status'] as changed_fields,
    ur.user_id as admin_user_id,
    au.email as admin_user_email,
    'Estado cambiado de Pendiente de Pago a Confirmada' as description
FROM public.reservations r
CROSS JOIN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'admin' 
    LIMIT 1
) ur
CROSS JOIN auth.users au
WHERE au.id = ur.user_id
AND r.status = 'confirmed'
AND r.id NOT IN (
    SELECT record_id::UUID 
    FROM public.audit_logs 
    WHERE table_name = 'reservations'
    AND action = 'UPDATE'
    AND new_values->>'status' = 'confirmed'
)
LIMIT 5;

-- 4. Verificar que se insertaron los datos
SELECT 
    COUNT(*) as total_audit_logs,
    COUNT(CASE WHEN table_name = 'reservations' THEN 1 END) as reservation_logs,
    COUNT(CASE WHEN action = 'INSERT' THEN 1 END) as insert_logs,
    COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as update_logs
FROM public.audit_logs;

-- 5. Verificar datos específicos de reservas
SELECT 
    al.table_name,
    al.record_id,
    al.action,
    al.old_values->>'status' as old_status,
    al.new_values->>'status' as new_status,
    al.admin_user_email,
    al.timestamp,
    al.description
FROM public.audit_logs al
WHERE al.table_name = 'reservations'
ORDER BY al.timestamp DESC
LIMIT 10;

-- 6. Probar la función get_reservation_history con una reserva que tenga datos
-- (Descomenta y reemplaza con un ID real)
-- SELECT * FROM get_reservation_history('RESERVATION_ID_CON_DATOS'); 