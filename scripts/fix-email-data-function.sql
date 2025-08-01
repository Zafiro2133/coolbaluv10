-- Script para agregar la función get_user_email que falta
-- Ejecutar este script en Supabase SQL Editor

-- Función para obtener el email de un usuario por su user_id
CREATE OR REPLACE FUNCTION get_user_email(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Obtener el email del usuario desde auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id_param;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función se creó correctamente
SELECT '✅ Función get_user_email creada correctamente' as status; 