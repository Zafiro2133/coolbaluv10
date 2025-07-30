-- Script para arreglar la función set_admin_context
-- Ejecutar manualmente en Supabase SQL Editor

-- 1. Eliminar la función existente
DROP FUNCTION IF EXISTS public.set_admin_context(UUID, TEXT);

-- 2. Recrear la función con mejor manejo de errores y optimización
CREATE OR REPLACE FUNCTION public.set_admin_context(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
    -- Verificar que los parámetros no sean nulos
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'user_id no puede ser nulo';
    END IF;
    
    IF user_email IS NULL OR user_email = '' THEN
        RAISE EXCEPTION 'user_email no puede ser nulo o vacío';
    END IF;
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id
    ) THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;
    
    -- Verificar que el usuario es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Usuario no tiene permisos de administrador';
    END IF;
    
    -- Establecer el contexto de admin
    PERFORM set_config('app.admin_user_id', user_id::TEXT, false);
    PERFORM set_config('app.admin_user_email', user_email, false);
    
    -- Log de debug (opcional, comentar en producción)
    -- RAISE NOTICE 'Contexto de admin establecido para: % (%)', user_email, user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log del error
        RAISE NOTICE 'Error al establecer contexto de admin: %', SQLERRM;
        -- Re-lanzar el error
        RAISE;
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
AND routine_name = 'set_admin_context';

-- 4. Crear una función más simple para casos donde no necesitamos verificación completa
CREATE OR REPLACE FUNCTION public.set_admin_context_simple(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
    -- Establecer el contexto sin verificaciones adicionales
    PERFORM set_config('app.admin_user_id', user_id::TEXT, false);
    PERFORM set_config('app.admin_user_email', user_email, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar ambas funciones
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('set_admin_context', 'set_admin_context_simple')
ORDER BY routine_name; 