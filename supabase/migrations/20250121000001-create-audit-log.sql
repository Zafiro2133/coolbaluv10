-- =====================================================
-- MIGRACIÓN: Sistema de Auditoría para Revertir Acciones
-- Fecha: 2025-01-21
-- Propósito: Permitir al administrador revertir cambios en reservas
-- =====================================================

-- 1. Crear tabla de auditoría
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    admin_user_id UUID REFERENCES auth.users(id),
    admin_user_email TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    description TEXT
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_admin_user ON public.audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- 3. Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para audit_logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 5. Función para registrar cambios en reservas
CREATE OR REPLACE FUNCTION public.log_reservation_change()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    admin_user_id UUID;
    admin_user_email TEXT;
BEGIN
    -- Obtener información del usuario admin actual
    SELECT current_setting('app.admin_user_id', true)::UUID INTO admin_user_id;
    SELECT current_setting('app.admin_user_email', true) INTO admin_user_email;
    
    -- Determinar qué campos cambiaron
    IF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Detectar campos cambiados
        SELECT array_agg(key) INTO changed_fields
        FROM (
            SELECT key FROM jsonb_object_keys(old_data)
            UNION
            SELECT key FROM jsonb_object_keys(new_data)
        ) keys
        WHERE old_data->key IS DISTINCT FROM new_data->key;
    ELSIF TG_OP = 'INSERT' THEN
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
    END IF;
    
    -- Insertar registro de auditoría
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
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_data,
        new_data,
        changed_fields,
        admin_user_id,
        admin_user_email,
        CASE 
            WHEN TG_OP = 'UPDATE' AND 'status' = ANY(changed_fields) 
            THEN 'Cambio de estado de reserva: ' || COALESCE(OLD.status, 'N/A') || ' → ' || COALESCE(NEW.status, 'N/A')
            WHEN TG_OP = 'UPDATE' 
            THEN 'Actualización de reserva'
            WHEN TG_OP = 'INSERT' 
            THEN 'Nueva reserva creada'
            WHEN TG_OP = 'DELETE' 
            THEN 'Reserva eliminada'
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para la tabla reservations
DROP TRIGGER IF EXISTS audit_reservations_trigger ON public.reservations;
CREATE TRIGGER audit_reservations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.log_reservation_change();

-- 7. Función para revertir cambios de estado
CREATE OR REPLACE FUNCTION public.revert_reservation_status(
    reservation_id UUID,
    target_status TEXT,
    admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    audit_record RECORD;
BEGIN
    -- Verificar que el usuario es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = admin_user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Usuario no autorizado';
    END IF;
    
    -- Obtener estado actual
    SELECT status INTO current_status
    FROM public.reservations
    WHERE id = reservation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva no encontrada';
    END IF;
    
    -- Buscar el registro de auditoría más reciente con el estado objetivo
    SELECT * INTO audit_record
    FROM public.audit_logs
    WHERE table_name = 'reservations'
    AND record_id = reservation_id
    AND action = 'UPDATE'
    AND new_values->>'status' = target_status
    ORDER BY timestamp DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró historial para el estado solicitado';
    END IF;
    
    -- Revertir al estado anterior
    UPDATE public.reservations
    SET 
        status = target_status,
        updated_at = now()
    WHERE id = reservation_id;
    
    -- Registrar la reversión en el log de auditoría
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        admin_user_id,
        description
    ) VALUES (
        'reservations',
        reservation_id,
        'UPDATE',
        jsonb_build_object('status', current_status),
        jsonb_build_object('status', target_status),
        ARRAY['status'],
        admin_user_id,
        'Reversión manual de estado: ' || current_status || ' → ' || target_status
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para obtener historial de cambios de una reserva
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
    RETURN QUERY
    SELECT 
        al.id,
        al.action,
        al.old_values->>'status' as old_status,
        al.new_values->>'status' as new_status,
        al.admin_user_email,
        al.timestamp as change_timestamp,
        al.description
    FROM public.audit_logs al
    WHERE al.table_name = 'reservations'
    AND al.record_id = reservation_id
    ORDER BY al.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función helper para establecer contexto de admin
CREATE OR REPLACE FUNCTION public.set_admin_context(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.admin_user_id', user_id::TEXT, false);
    PERFORM set_config('app.admin_user_email', user_email, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 