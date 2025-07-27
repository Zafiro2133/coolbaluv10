-- Corregir tipo de dato del campo id en zones para que sea UUID
-- Fecha: 2025-01-18

-- 1. Verificar si la tabla zones existe y su estructura actual
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zones') THEN
        RAISE NOTICE 'La tabla zones no existe, se creará con UUID';
    ELSE
        RAISE NOTICE 'La tabla zones existe, verificando estructura...';
    END IF;
END $$;

-- 2. Eliminar la tabla zones si existe para recrearla con UUID
DROP TABLE IF EXISTS zones CASCADE;

-- 3. Recrear la tabla zones con id UUID
CREATE TABLE zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    postal_codes TEXT[],
    neighborhoods TEXT[],
    transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    coordinates JSONB, -- Coordenadas GeoJSON del polígono
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- 5. Crear policies para zones
CREATE POLICY "Anyone can view zones" ON zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage zones" ON zones FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- 6. Crear trigger para updated_at
CREATE TRIGGER update_zones_updated_at
    BEFORE UPDATE ON zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Insertar algunas zonas de ejemplo
INSERT INTO zones (name, description, transport_cost, is_active) VALUES
('Centro', 'Zona centro de la ciudad', 5000, true),
('Norte', 'Zona norte de la ciudad', 8000, true),
('Sur', 'Zona sur de la ciudad', 6000, true),
('Este', 'Zona este de la ciudad', 7000, true),
('Oeste', 'Zona oeste de la ciudad', 7500, true)
ON CONFLICT (name) DO NOTHING;

-- 8. Verificar que la tabla se creó correctamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zones') THEN
        RAISE EXCEPTION 'La tabla zones no se creó correctamente';
    END IF;
    
    -- Verificar que el campo id es UUID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zones' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE EXCEPTION 'El campo id de zones no es de tipo UUID';
    END IF;
    
    RAISE NOTICE '✅ Tabla zones recreada correctamente con id UUID.';
END $$; 