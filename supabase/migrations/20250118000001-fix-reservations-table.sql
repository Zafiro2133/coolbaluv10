-- Corregir estructura de la tabla reservations
-- Fecha: 2025-01-18

-- 1. Eliminar la tabla si existe para recrearla correctamente
DROP TABLE IF EXISTS reservation_items CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;

-- 2. Recrear la tabla reservations con la estructura correcta
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_address TEXT NOT NULL,

    phone TEXT NOT NULL,
    adult_count INTEGER NOT NULL DEFAULT 1,
    child_count INTEGER NOT NULL DEFAULT 0,
    comments TEXT,
    rain_reschedule TEXT DEFAULT 'no' CHECK (rain_reschedule IN ('no', 'indoor', 'reschedule')),
    subtotal DECIMAL(10,2) NOT NULL,
    transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed')),
    payment_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recrear la tabla reservation_items
CREATE TABLE reservation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    extra_hours INTEGER NOT NULL DEFAULT 0,
    extra_hour_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    item_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- 5. Crear policies para reservations
CREATE POLICY "Users can view their own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" ON reservations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update all reservations" ON reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 6. Crear policies para reservation_items
CREATE POLICY "Users can view their reservation items" ON reservation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reservations 
            WHERE reservations.id = reservation_items.reservation_id 
            AND reservations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reservation items" ON reservation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM reservations 
            WHERE reservations.id = reservation_items.reservation_id 
            AND reservations.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all reservation items" ON reservation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can insert all reservation items" ON reservation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 7. Crear índices
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_event_date ON reservations(event_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservation_items_reservation_id ON reservation_items(reservation_id);

-- 8. Crear triggers
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_reservation_total_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_reservation_total();

-- 9. Verificar que todo esté correcto
DO $$
BEGIN
    -- Verificar que la tabla existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        RAISE EXCEPTION 'La tabla reservations no existe';
    END IF;
    
    -- Verificar que el campo rain_reschedule existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'rain_reschedule') THEN
        RAISE EXCEPTION 'El campo rain_reschedule no existe';
    END IF;
    
    -- Verificar que el campo transport_cost existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'transport_cost') THEN
        RAISE EXCEPTION 'El campo transport_cost no existe';
    END IF;
    
    RAISE NOTICE '✅ Tabla reservations recreada correctamente con todos los campos necesarios.';
END $$; 