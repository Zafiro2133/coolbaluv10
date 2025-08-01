-- Script para corregir la eliminación de usuarios en Supabase
-- ⚠️ ADVERTENCIA: Ejecuta esto en el SQL Editor de Supabase

-- Paso 1: Verificar el estado actual de las foreign keys
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ PERMITE ELIMINACIÓN'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ SET NULL'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOQUEA ELIMINACIÓN'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ BLOQUEA ELIMINACIÓN'
        ELSE '❓ DESCONOCIDO'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.referenced_table_name = 'users'
    AND kcu.referenced_table_schema = 'auth'
ORDER BY tc.table_name, kcu.column_name;

-- Paso 2: Corregir foreign key de audit_log (si existe)
DO $$
BEGIN
    -- Buscar y eliminar la constraint existente sin CASCADE
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'audit_log' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        EXECUTE (
            'ALTER TABLE public.audit_log DROP CONSTRAINT ' || 
            (SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'audit_log' 
             AND constraint_type = 'FOREIGN KEY'
             AND constraint_name LIKE '%user_id%'
             LIMIT 1)
        );
        
        -- Agregar la foreign key con CASCADE
        ALTER TABLE public.audit_log 
        ADD CONSTRAINT audit_log_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de audit_log corregida con CASCADE';
    ELSE
        RAISE NOTICE 'ℹ️ No se encontró foreign key de audit_log para corregir';
    END IF;
END $$;

-- Paso 3: Verificar que todas las tablas tengan CASCADE configurado
SELECT 
    tc.table_name,
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CORRECTO'
        ELSE '❌ NECESITA CORRECCIÓN'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('profiles', 'user_roles', 'reservations', 'reservation_items', 'audit_log')
    AND tc.constraint_name LIKE '%user_id%'
ORDER BY tc.table_name;

-- Paso 4: Función para eliminar usuarios de forma segura
CREATE OR REPLACE FUNCTION delete_user_safely(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    deleted_count INTEGER := 0;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN '❌ Usuario no encontrado: ' || user_email;
    END IF;
    
    -- Eliminar registros de audit_log (si existe la tabla)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        DELETE FROM public.audit_log WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '🗑️ Eliminados % registros de audit_log', deleted_count;
    END IF;
    
    -- Eliminar el usuario de auth.users
    DELETE FROM auth.users WHERE id = user_id;
    
    IF FOUND THEN
        RETURN '✅ Usuario eliminado exitosamente: ' || user_email;
    ELSE
        RETURN '❌ Error al eliminar usuario: ' || user_email;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN '❌ Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 5: Ejemplo de uso de la función
-- SELECT delete_user_safely('usuario@email.com');

-- Paso 6: Verificar que la función se creó correctamente
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'delete_user_safely'; 