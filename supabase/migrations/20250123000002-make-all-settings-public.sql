-- MIGRACIÓN: Marcar todas las configuraciones del sistema como públicas
-- Propósito: Todas las configuraciones que el administrador puede editar deben ser visibles públicamente

-- 1. Actualizar todas las configuraciones existentes para que sean públicas
UPDATE public.system_settings 
SET is_public = true
WHERE is_public = false;

-- 2. Verificar que todas las configuraciones ahora son públicas
DO $$
DECLARE
    public_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM public.system_settings;
    SELECT COUNT(*) INTO public_count FROM public.system_settings WHERE is_public = true;
    
    IF public_count = total_count THEN
        RAISE NOTICE '✅ Todas las configuraciones del sistema (% configuraciones) ahora son públicas', total_count;
    ELSE
        RAISE EXCEPTION '❌ Error: Solo % de % configuraciones son públicas', public_count, total_count;
    END IF;
END $$;

-- 3. Verificar que las configuraciones específicas están marcadas como públicas
DO $$
DECLARE
    contact_email_public BOOLEAN;
    contact_phone_public BOOLEAN;
    business_hours_public BOOLEAN;
BEGIN
    SELECT is_public INTO contact_email_public FROM public.system_settings WHERE setting_key = 'contact_email';
    SELECT is_public INTO contact_phone_public FROM public.system_settings WHERE setting_key = 'contact_phone';
    SELECT is_public INTO business_hours_public FROM public.system_settings WHERE setting_key = 'business_hours';
    
    IF contact_email_public AND contact_phone_public AND business_hours_public THEN
        RAISE NOTICE '✅ Configuraciones de contacto y horarios marcadas como públicas correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Algunas configuraciones no están marcadas como públicas';
    END IF;
END $$;

-- 4. Crear función helper para verificar si una configuración es pública
CREATE OR REPLACE FUNCTION is_public_setting(setting_key_param VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
    setting_is_public BOOLEAN;
BEGIN
    SELECT is_public INTO setting_is_public
    FROM public.system_settings
    WHERE setting_key = setting_key_param;
    
    RETURN COALESCE(setting_is_public, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar que la función se creó correctamente
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'is_public_setting'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Función is_public_setting creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Función is_public_setting no se creó';
    END IF;
END $$;

-- 6. Verificar que todo está funcionando correctamente
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- Probar la función con una configuración que sabemos que es pública
    SELECT is_public_setting('company_name') INTO test_result;
    
    IF test_result THEN
        RAISE NOTICE '✅ Verificación completada: Todas las configuraciones del sistema son públicas';
    ELSE
        RAISE EXCEPTION '❌ Error: La función is_public_setting no está funcionando correctamente';
    END IF;
END $$; 