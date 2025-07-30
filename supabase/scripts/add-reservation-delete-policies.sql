-- Script para agregar políticas de DELETE para reservas
-- Ejecutar manualmente en el SQL Editor de Supabase

-- 1. Política para que los admins puedan eliminar reservas
CREATE POLICY "Admins can delete reservations" 
ON public.reservations 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Política para que los admins puedan eliminar reservation_items
CREATE POLICY "Admins can delete reservation items" 
ON public.reservation_items 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Política para que los usuarios puedan eliminar sus propias reservas (opcional)
CREATE POLICY "Users can delete their own reservations" 
ON public.reservations 
FOR DELETE 
USING (user_id = auth.uid());

-- 4. Política para que los usuarios puedan eliminar sus propios reservation_items
CREATE POLICY "Users can delete their own reservation items" 
ON public.reservation_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

-- 5. Verificar que las políticas se crearon correctamente
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
WHERE tablename IN ('reservations', 'reservation_items')
AND cmd = 'DELETE'
ORDER BY tablename, policyname; 