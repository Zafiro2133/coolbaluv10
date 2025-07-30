-- Script para arreglar la función get_reservation_history
-- Ejecutar manualmente en Supabase SQL Editor

-- 1. Eliminar la función existente si hay problemas
DROP FUNCTION IF EXISTS public.get_reservation_history(UUID);

-- 2. Recrear la función get_reservation_history con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.get_reservation_history(reservation_id UUID)
RETURNS TABLE (
    id UUID,
    action TEXT,
    old_status TEXT,
    new_status TEXT,
    admin_user_email TEXT,
    change_timestamp TIMESTAMP WITH TIME ZONE,
    description TEXT
) AS $$
BEGIN
    -- Verificar que el usuario tiene permisos para ver esta reserva
    IF NOT EXISTS (
        SELECT 1 FROM public.reservations 
        WHERE id = reservation_id
        AND (
            user_id = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
    ) THEN
        RAISE EXCEPTION 'No tienes permisos para ver esta reserva';
    END IF;

    RETURN QUERY
    SELECT 
        al.id,
        al.action,
        COALESCE(al.old_values->>'status', 'N/A') as old_status,
        COALESCE(al.new_values->>'status', 'N/A') as new_status,
        al.admin_user_email,
        al.timestamp as change_timestamp,
        COALESCE(al.description, 'Sin descripción') as description
    FROM public.audit_logs al
    WHERE al.table_name = 'reservations'
    AND al.record_id = reservation_id::TEXT
    ORDER BY al.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar que la función se creó correctamente
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_reservation_history';

-- 4. Probar la función con una reserva existente (descomenta y reemplaza el UUID)
-- SELECT * FROM get_reservation_history('TU_RESERVATION_ID_AQUI');

-- 5. Verificar que las políticas RLS de audit_logs permiten acceso
-- Si no hay políticas, crearlas:

-- Habilitar RLS si no está habilitado
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

-- Política para que los admins puedan ver todos los logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para que los usuarios puedan ver logs de sus propias reservas
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reservations 
            WHERE id = record_id::UUID
            AND user_id = auth.uid()
        )
    );

-- Política para que el sistema pueda insertar logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 6. Verificar que las políticas se crearon correctamente
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

-- 7. Verificar que hay datos de auditoría para probar
SELECT 
    COUNT(*) as total_audit_logs,
    COUNT(CASE WHEN table_name = 'reservations' THEN 1 END) as reservation_logs
FROM public.audit_logs; 