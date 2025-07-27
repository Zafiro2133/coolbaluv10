-- =====================================================
-- MIGRACIÓN: Corregir Foreign Keys de Reservations
-- Fecha: 2025-01-20
-- Problema: Falta foreign key correcta entre reservations y profiles
-- =====================================================

-- 1. Eliminar foreign key incorrecta si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservations_user_id_profiles_fkey' 
        AND table_name = 'reservations'
    ) THEN
        ALTER TABLE public.reservations 
        DROP CONSTRAINT reservations_user_id_profiles_fkey;
    END IF;
END $$;

-- 2. Crear foreign key correcta
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservations_user_id_fkey' 
        AND table_name = 'reservations'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT reservations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Verificar que la foreign key se creó correctamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservations_user_id_fkey' 
        AND table_name = 'reservations'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'La foreign key reservations_user_id_fkey no se creó correctamente';
    END IF;
    
    RAISE NOTICE '✅ Foreign key de reservations corregida correctamente.';
END $$;

-- 4. Verificar que la consulta funciona
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Intentar hacer una consulta de prueba
    SELECT COUNT(*) INTO test_result
    FROM public.reservations r
    LEFT JOIN public.profiles p ON r.user_id = p.user_id
    LIMIT 1;
    
    RAISE NOTICE '✅ Consulta de prueba exitosa.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en consulta de prueba: %', SQLERRM;
END $$; 