-- Crear funciones necesarias para los triggers
-- Fecha: 2025-01-18

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para calcular total automáticamente
CREATE OR REPLACE FUNCTION calculate_reservation_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total = NEW.subtotal + COALESCE(NEW.transport_cost, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Verificar que las funciones se crearon correctamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION 'La función update_updated_at_column no se creó correctamente';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_reservation_total') THEN
        RAISE EXCEPTION 'La función calculate_reservation_total no se creó correctamente';
    END IF;
    
    RAISE NOTICE '✅ Funciones creadas correctamente.';
END $$; 