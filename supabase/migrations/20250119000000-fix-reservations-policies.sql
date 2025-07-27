-- =====================================================
-- MIGRACIÓN: Corregir políticas de la tabla reservations
-- Fecha: 2025-01-19
-- Problema: Las políticas usan raw_user_meta_data en lugar de has_role
-- =====================================================

-- Eliminar políticas existentes de reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can insert their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;

-- Eliminar políticas existentes de reservation_items
DROP POLICY IF EXISTS "Users can view their reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Users can insert reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Admins can view all reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Admins can insert all reservation items" ON reservation_items;

-- Crear políticas corregidas para reservations usando has_role
CREATE POLICY "Users can view their own reservations" 
ON reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations" 
ON reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para admins usando has_role
CREATE POLICY "Admins can view all reservations" 
ON reservations 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reservations" 
ON reservations 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert reservations" 
ON reservations 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Crear políticas corregidas para reservation_items
CREATE POLICY "Users can view their reservation items" 
ON reservation_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert reservation items" 
ON reservation_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

-- Políticas para admins usando has_role
CREATE POLICY "Admins can view all reservation items" 
ON reservation_items 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all reservation items" 
ON reservation_items 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reservation items" 
ON reservation_items 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Verificar que las políticas se crearon correctamente
SELECT 
    'reservations' as table_name,
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
WHERE tablename = 'reservations'
ORDER BY policyname;

SELECT 
    'reservation_items' as table_name,
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
WHERE tablename = 'reservation_items'
ORDER BY policyname;

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('reservations', 'reservation_items');

-- Verificar que la función has_role existe y funciona
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'has_role' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE EXCEPTION 'La función has_role no existe. Asegúrate de que esté creada.';
    END IF;
    
    RAISE NOTICE '✅ Políticas de reservations corregidas correctamente usando has_role.';
END $$; 