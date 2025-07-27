-- Migración para agregar campo de reprogramación por lluvia
-- Fecha: 2025-01-18

-- 1. Agregar el campo rain_reschedule a la tabla reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS rain_reschedule TEXT DEFAULT 'no' CHECK (rain_reschedule IN ('no', 'indoor', 'reschedule'));

-- 2. Actualizar la tabla reservations con la estructura completa
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_address TEXT NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    adult_count INTEGER NOT NULL DEFAULT 1,
    child_count INTEGER NOT NULL DEFAULT 0,
    comments TEXT,
    rain_reschedule TEXT DEFAULT 'no' CHECK (rain_reschedule IN ('no', 'indoor', 'reschedule')),
    subtotal DECIMAL(10,2) NOT NULL,
    transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS en todas las tablas
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 4. Crear policies para reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
CREATE POLICY "Users can view their own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reservations" ON reservations;
CREATE POLICY "Users can insert their own reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
CREATE POLICY "Users can update their own reservations" ON reservations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
CREATE POLICY "Admins can view all reservations" ON reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;
CREATE POLICY "Admins can update all reservations" ON reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 5. Crear policies para reservation_items
DROP POLICY IF EXISTS "Users can view their reservation items" ON reservation_items;
CREATE POLICY "Users can view their reservation items" ON reservation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reservations 
            WHERE reservations.id = reservation_items.reservation_id 
            AND reservations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert reservation items" ON reservation_items;
CREATE POLICY "Users can insert reservation items" ON reservation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM reservations 
            WHERE reservations.id = reservation_items.reservation_id 
            AND reservations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all reservation items" ON reservation_items;
CREATE POLICY "Admins can view all reservation items" ON reservation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert all reservation items" ON reservation_items;
CREATE POLICY "Admins can insert all reservation items" ON reservation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 6. Crear policies para products (lectura pública, escritura solo admin)
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 7. Crear policies para zones (lectura pública, escritura solo admin)
DROP POLICY IF EXISTS "Anyone can view zones" ON zones;
CREATE POLICY "Anyone can view zones" ON zones
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage zones" ON zones;
CREATE POLICY "Admins can manage zones" ON zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 8. Crear policies para availabilities (lectura pública, escritura solo admin)
DROP POLICY IF EXISTS "Anyone can view availabilities" ON availabilities;
CREATE POLICY "Anyone can view availabilities" ON availabilities
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage availabilities" ON availabilities;
CREATE POLICY "Admins can manage availabilities" ON availabilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 9. Crear policies para contact_messages (usuarios pueden insertar, admins pueden ver todos)
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_messages;
CREATE POLICY "Admins can view all contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 10. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_availabilities_date ON availabilities(date);

-- 11. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Crear trigger para actualizar updated_at en reservations
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Crear función para validar que el usuario existe
CREATE OR REPLACE FUNCTION validate_user_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. Crear trigger para validar usuario en reservations
DROP TRIGGER IF EXISTS validate_reservation_user ON reservations;
CREATE TRIGGER validate_reservation_user
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_exists();

-- 15. Crear función para calcular total automáticamente
CREATE OR REPLACE FUNCTION calculate_reservation_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total = NEW.subtotal + COALESCE(NEW.transport_cost, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 16. Crear trigger para calcular total en reservations
DROP TRIGGER IF EXISTS calculate_reservation_total_trigger ON reservations;
CREATE TRIGGER calculate_reservation_total_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_reservation_total();

-- 17. Comentarios para documentar la estructura
COMMENT ON TABLE reservations IS 'Tabla principal de reservas de eventos';
COMMENT ON COLUMN reservations.rain_reschedule IS 'Opciones: no (no reprogramar), indoor (lugar techado), reschedule (reprogramar automáticamente)';
COMMENT ON COLUMN reservations.status IS 'Estados: pending_payment, confirmed, cancelled, completed';

-- 18. Verificar que todo esté configurado correctamente
DO $$
BEGIN
    -- Verificar que las tablas existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        RAISE EXCEPTION 'La tabla reservations no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_items') THEN
        RAISE EXCEPTION 'La tabla reservation_items no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE EXCEPTION 'La tabla products no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zones') THEN
        RAISE EXCEPTION 'La tabla zones no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'availabilities') THEN
        RAISE EXCEPTION 'La tabla availabilities no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_messages') THEN
        RAISE EXCEPTION 'La tabla contact_messages no existe';
    END IF;
    
    RAISE NOTICE 'Migración completada exitosamente. Todas las tablas, policies y triggers están configurados.';
END $$; 