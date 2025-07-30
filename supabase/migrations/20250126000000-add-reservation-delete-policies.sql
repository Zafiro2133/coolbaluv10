-- Agregar políticas de DELETE para reservas y reservation_items
-- Fecha: 2025-01-26

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
DO $$
BEGIN
    -- Verificar políticas de reservas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reservations' 
        AND policyname = 'Admins can delete reservations'
    ) THEN
        RAISE EXCEPTION 'Política de eliminación de reservas para admins no se creó correctamente';
    END IF;

    -- Verificar políticas de reservation_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reservation_items' 
        AND policyname = 'Admins can delete reservation items'
    ) THEN
        RAISE EXCEPTION 'Política de eliminación de reservation_items para admins no se creó correctamente';
    END IF;

    RAISE NOTICE 'Todas las políticas de eliminación se crearon correctamente';
END $$; 