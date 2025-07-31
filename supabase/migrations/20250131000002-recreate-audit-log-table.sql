-- =====================================================
-- MIGRACIÓN: Recrear tabla audit_log eliminada accidentalmente
-- Fecha: 2025-01-31
-- Problema: La tabla public.audit_log fue eliminada accidentalmente
-- Solución: Recrear la tabla con estructura estándar
-- =====================================================

-- 1. Crear la tabla audit_log con estructura estándar
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

-- 3. Habilitar RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad (solo admins pueden ver audit_log)
CREATE POLICY "Admins can view audit_log" ON public.audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 5. Crear función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION log_reservation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Solo registrar si hay cambios reales
    IF TG_OP = 'UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO public.audit_log (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Crear trigger para registrar cambios en reservations
DROP TRIGGER IF EXISTS audit_reservations_trigger ON public.reservations;
CREATE TRIGGER audit_reservations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_change();

-- 7. Crear trigger para registrar cambios en reservation_items
DROP TRIGGER IF EXISTS audit_reservation_items_trigger ON public.reservation_items;
CREATE TRIGGER audit_reservation_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reservation_items
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_change();

-- 8. Verificar que todo se creó correctamente
DO $$
BEGIN
    -- Verificar que la tabla existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        RAISE EXCEPTION '❌ La tabla audit_log no se creó correctamente';
    END IF;
    
    -- Verificar que la función existe
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_reservation_change') THEN
        RAISE EXCEPTION '❌ La función log_reservation_change no se creó correctamente';
    END IF;
    
    -- Verificar que los triggers existen
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'audit_reservations_trigger' 
        AND tgrelid = 'public.reservations'::regclass
    ) THEN
        RAISE EXCEPTION '❌ El trigger audit_reservations_trigger no se creó correctamente';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'audit_reservation_items_trigger' 
        AND tgrelid = 'public.reservation_items'::regclass
    ) THEN
        RAISE EXCEPTION '❌ El trigger audit_reservation_items_trigger no se creó correctamente';
    END IF;
    
    RAISE NOTICE '✅ Tabla audit_log recreada correctamente';
    RAISE NOTICE '✅ Función log_reservation_change creada';
    RAISE NOTICE '✅ Triggers de auditoría configurados';
    RAISE NOTICE '✅ Políticas de seguridad aplicadas';
    RAISE NOTICE '🎉 ¡Auditoría de cambios restaurada!';
END $$; 