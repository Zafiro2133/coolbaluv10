-- =====================================================
-- MIGRACIÓN: Mejorar políticas de availabilities
-- Fecha: 2025-01-17
-- =====================================================

-- Eliminar políticas existentes para recrearlas con mejor configuración
DROP POLICY IF EXISTS "Availabilities are viewable by everyone" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can manage availabilities" ON public.availabilities;

-- Política 1: Todos pueden ver las disponibilidades (para el formulario de reserva)
CREATE POLICY "Availabilities are viewable by everyone" 
ON public.availabilities 
FOR SELECT 
USING (true);

-- Política 2: Solo admins pueden insertar nuevas disponibilidades
CREATE POLICY "Admins can insert availabilities" 
ON public.availabilities 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política 3: Solo admins pueden actualizar disponibilidades
CREATE POLICY "Admins can update availabilities" 
ON public.availabilities 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política 4: Solo admins pueden eliminar disponibilidades
CREATE POLICY "Admins can delete availabilities" 
ON public.availabilities 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'availabilities'
ORDER BY policyname;

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'availabilities'; 