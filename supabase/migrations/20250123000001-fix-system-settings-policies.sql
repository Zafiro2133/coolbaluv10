-- MIGRACIÓN: Corregir políticas RLS para system_settings
-- Propósito: Asegurar que los administradores puedan editar configuraciones del sistema

-- 1. Eliminar políticas existentes para recrearlas correctamente
DROP POLICY IF EXISTS "admin_full_access_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_read_public_settings" ON public.system_settings;

-- 2. Crear política para administradores: acceso completo (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "admin_full_access_system_settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- 3. Crear política para usuarios autenticados: solo lectura de configuraciones públicas
CREATE POLICY "authenticated_read_public_settings" ON public.system_settings
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_public = true
    );

-- 4. Verificar que las políticas se crearon correctamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'system_settings' 
    AND schemaname = 'public';
    
    IF policy_count >= 2 THEN
        RAISE NOTICE '✅ Políticas RLS creadas correctamente: % políticas encontradas', policy_count;
    ELSE
        RAISE EXCEPTION '❌ Error: Solo se encontraron % políticas de las 2 esperadas', policy_count;
    END IF;
END $$;

-- 5. Crear función helper para verificar permisos de administrador
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear función para obtener configuraciones del sistema con verificación de permisos
CREATE OR REPLACE FUNCTION get_system_settings_for_user()
RETURNS TABLE (
    setting_key VARCHAR(100),
    setting_value TEXT,
    setting_type VARCHAR(50),
    description TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Si es administrador, devolver todas las configuraciones
    IF is_admin_user() THEN
        RETURN QUERY
        SELECT 
            ss.setting_key,
            ss.setting_value,
            ss.setting_type,
            ss.description,
            ss.is_public,
            ss.created_at,
            ss.updated_at
        FROM public.system_settings ss
        ORDER BY ss.setting_key;
    ELSE
        -- Si es usuario autenticado, devolver solo configuraciones públicas
        RETURN QUERY
        SELECT 
            ss.setting_key,
            ss.setting_value,
            ss.setting_type,
            ss.description,
            ss.is_public,
            ss.created_at,
            ss.updated_at
        FROM public.system_settings ss
        WHERE ss.is_public = true
        ORDER BY ss.setting_key;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear función para actualizar configuración con verificación de permisos
CREATE OR REPLACE FUNCTION update_system_setting_secure(
    setting_key_param VARCHAR(100),
    setting_value_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que el usuario es administrador
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden actualizar configuraciones del sistema';
    END IF;
    
    -- Actualizar la configuración
    UPDATE public.system_settings
    SET setting_value = setting_value_param,
        updated_at = NOW()
    WHERE setting_key = setting_key_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verificar que las funciones se crearon correctamente
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('is_admin_user', 'get_system_settings_for_user', 'update_system_setting_secure');
    
    IF function_count >= 3 THEN
        RAISE NOTICE '✅ Funciones helper creadas correctamente: % funciones encontradas', function_count;
    ELSE
        RAISE EXCEPTION '❌ Error: Solo se encontraron % funciones de las 3 esperadas', function_count;
    END IF;
END $$;

-- 9. Verificar que todo está funcionando correctamente
DO $$
DECLARE
    admin_check BOOLEAN;
    settings_count INTEGER;
BEGIN
    -- Verificar que hay configuraciones en la tabla
    SELECT COUNT(*) INTO settings_count FROM public.system_settings;
    
    IF settings_count >= 9 THEN
        RAISE NOTICE '✅ Verificación completada: % configuraciones del sistema disponibles', settings_count;
    ELSE
        RAISE EXCEPTION '❌ Error: Solo se encontraron % configuraciones de las 9 esperadas', settings_count;
    END IF;
END $$; 