-- MIGRACIÓN: Crear tabla de configuración del sistema
-- Propósito: Almacenar configuraciones globales del sistema como costo de hora extra

-- 1. Crear tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON public.system_settings(is_public);

-- 3. Insertar configuraciones iniciales
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('extra_hour_cost', '5000', 'number', 'Costo por hora extra en pesos argentinos', true),
('base_event_duration', '3', 'number', 'Duración base del evento en horas', true),
('max_extra_hours', '5', 'number', 'Máximo de horas extra permitidas', true),
('transport_cost_base', '2000', 'number', 'Costo base de transporte en pesos argentinos', true),
('currency', 'ARS', 'string', 'Moneda del sistema', true),
('company_name', 'Coolbalu', 'string', 'Nombre de la empresa', true),
('contact_email', 'info@coolbalu.com', 'string', 'Email de contacto', true),
('contact_phone', '+54 9 11 1234-5678', 'string', 'Teléfono de contacto', true),
('business_hours', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "16:00"}, "sunday": {"open": "closed", "close": "closed"}}', 'json', 'Horarios de atención', true)
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trigger_update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- 6. Crear políticas RLS (Row Level Security)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para administradores: pueden leer y escribir todas las configuraciones
CREATE POLICY "admin_full_access_system_settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Política para usuarios autenticados: pueden leer configuraciones públicas
CREATE POLICY "authenticated_read_public_settings" ON public.system_settings
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_public = true
    );

-- 7. Crear función helper para obtener configuración
CREATE OR REPLACE FUNCTION get_system_setting(setting_key_param VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT setting_value INTO setting_value
    FROM public.system_settings
    WHERE setting_key = setting_key_param;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear función helper para actualizar configuración
CREATE OR REPLACE FUNCTION update_system_setting(
    setting_key_param VARCHAR(100),
    setting_value_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.system_settings
    SET setting_value = setting_value_param,
        updated_at = NOW()
    WHERE setting_key = setting_key_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Verificar que la migración se completó correctamente
DO $$
DECLARE
    settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO settings_count FROM public.system_settings;
    
    IF settings_count >= 9 THEN
        RAISE NOTICE '✅ Migración completada exitosamente. Se crearon % configuraciones iniciales.', settings_count;
    ELSE
        RAISE EXCEPTION '❌ Error en la migración: Solo se crearon % configuraciones de las 9 esperadas', settings_count;
    END IF;
END $$; 