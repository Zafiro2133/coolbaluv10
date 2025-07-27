-- =====================================================
-- MIGRACIÓN: Solucionar todos los errores de reservas
-- Fecha: 2025-01-20
-- Problemas identificados:
-- 1. Falta función has_role
-- 2. Políticas de RLS inconsistentes
-- 3. Triggers faltantes
-- 4. Índices faltantes
-- 5. Validaciones de datos
-- =====================================================

-- 1. Crear función has_role si no existe
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- 2. Asegurar que la tabla reservations existe con la estructura correcta
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        CREATE TABLE public.reservations (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            event_date DATE NOT NULL,
            event_time TIME NOT NULL,
            event_address TEXT NOT NULL,
            zone_id UUID REFERENCES public.zones(id),
            phone TEXT NOT NULL,
            adult_count INTEGER NOT NULL DEFAULT 1,
            child_count INTEGER NOT NULL DEFAULT 0,
            comments TEXT,
            rain_reschedule TEXT NOT NULL DEFAULT 'no',
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
            transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
            total DECIMAL(10,2) NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending_payment',
            payment_proof_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
    
    -- Agregar foreign key a profiles si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservations_user_id_fkey' 
        AND table_name = 'reservations'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT reservations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
    
    -- Agregar columnas faltantes si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'rain_reschedule') THEN
        ALTER TABLE public.reservations ADD COLUMN rain_reschedule TEXT NOT NULL DEFAULT 'no';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'transport_cost') THEN
        ALTER TABLE public.reservations ADD COLUMN transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'phone') THEN
        ALTER TABLE public.reservations ADD COLUMN phone TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- 3. Asegurar que la tabla reservation_items existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_items') THEN
        CREATE TABLE public.reservation_items (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES public.products(id),
            product_name TEXT NOT NULL,
            product_price DECIMAL(10,2) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            extra_hours INTEGER NOT NULL DEFAULT 0,
            extra_hour_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
            item_total DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- 4. Habilitar RLS en ambas tablas
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can insert reservations" ON public.reservations;

DROP POLICY IF EXISTS "Users can view their reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Users can insert reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can view all reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can insert all reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can update all reservation items" ON public.reservation_items;

-- 6. Crear políticas corregidas para reservations
CREATE POLICY "Users can view their own reservations" 
ON public.reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" 
ON public.reservations 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reservations" 
ON public.reservations 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Crear políticas corregidas para reservation_items
CREATE POLICY "Users can view their reservation items" 
ON public.reservation_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert reservation items" 
ON public.reservation_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all reservation items" 
ON public.reservation_items 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all reservation items" 
ON public.reservation_items 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reservation items" 
ON public.reservation_items 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Crear funciones necesarias
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION calculate_reservation_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total = NEW.subtotal + COALESCE(NEW.transport_cost, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Crear triggers
DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS calculate_reservation_total_trigger ON public.reservations;
CREATE TRIGGER calculate_reservation_total_trigger
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_reservation_total();

-- 10. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON public.reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON public.reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_product_id ON public.reservation_items(product_id);

-- 11. Agregar validaciones de datos
ALTER TABLE public.reservations 
ADD CONSTRAINT check_adult_count CHECK (adult_count >= 1),
ADD CONSTRAINT check_child_count CHECK (child_count >= 0),
ADD CONSTRAINT check_subtotal CHECK (subtotal >= 0),
ADD CONSTRAINT check_transport_cost CHECK (transport_cost >= 0),
ADD CONSTRAINT check_total CHECK (total >= 0),
ADD CONSTRAINT check_rain_reschedule CHECK (rain_reschedule IN ('no', 'indoor', 'reschedule')),
ADD CONSTRAINT check_status CHECK (status IN ('pending_payment', 'paid', 'confirmed', 'cancelled', 'completed'));

ALTER TABLE public.reservation_items 
ADD CONSTRAINT check_quantity CHECK (quantity >= 1),
ADD CONSTRAINT check_extra_hours CHECK (extra_hours >= 0),
ADD CONSTRAINT check_product_price CHECK (product_price >= 0),
ADD CONSTRAINT check_item_total CHECK (item_total >= 0);

-- 12. Verificar que todo se creó correctamente
DO $$
BEGIN
    -- Verificar tablas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        RAISE EXCEPTION 'La tabla reservations no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_items') THEN
        RAISE EXCEPTION 'La tabla reservation_items no existe';
    END IF;
    
    -- Verificar funciones
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        RAISE EXCEPTION 'La función has_role no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION 'La función update_updated_at_column no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_reservation_total') THEN
        RAISE EXCEPTION 'La función calculate_reservation_total no existe';
    END IF;
    
    -- Verificar RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'reservations' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS no está habilitado en reservations';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'reservation_items' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS no está habilitado en reservation_items';
    END IF;
    
    RAISE NOTICE '✅ Todos los errores de reservas han sido solucionados correctamente.';
END $$; 