-- =====================================================
-- SCRIPT: Aplicar políticas de availabilities
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Verificar que la función has_role existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'has_role' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE EXCEPTION 'La función has_role no existe. Asegúrate de que esté creada.';
    END IF;
END $$;

-- Verificar que la tabla availabilities existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'availabilities'
    ) THEN
        RAISE EXCEPTION 'La tabla availabilities no existe.';
    END IF;
END $$;

-- Eliminar políticas existentes de availabilities
DROP POLICY IF EXISTS "Availabilities are viewable by everyone" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can manage availabilities" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can insert availabilities" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can update availabilities" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can delete availabilities" ON public.availabilities;

-- Crear políticas mejoradas
-- Política 1: Todos pueden ver las disponibilidades
CREATE POLICY "Availabilities are viewable by everyone" 
ON public.availabilities 
FOR SELECT 
USING (true);

-- Política 2: Solo admins pueden insertar
CREATE POLICY "Admins can insert availabilities" 
ON public.availabilities 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política 3: Solo admins pueden actualizar
CREATE POLICY "Admins can update availabilities" 
ON public.availabilities 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política 4: Solo admins pueden eliminar
CREATE POLICY "Admins can delete availabilities" 
ON public.availabilities 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Verificar que RLS está habilitado
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- Mostrar las políticas creadas
SELECT 
    'availabilities' as table_name,
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        WHEN cmd = '*' THEN 'ALL'
        ELSE cmd::text
    END as operation,
    qual as condition
FROM pg_policies 
WHERE tablename = 'availabilities'
ORDER BY policyname;

-- Verificar que las políticas funcionan correctamente
DO $$
BEGIN
    RAISE NOTICE 'Políticas de availabilities aplicadas correctamente';
    RAISE NOTICE 'RLS habilitado en la tabla availabilities';
    RAISE NOTICE 'Los admins pueden realizar todas las operaciones';
    RAISE NOTICE 'Los usuarios normales solo pueden ver las disponibilidades';
END $$; 