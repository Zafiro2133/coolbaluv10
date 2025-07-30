-- Agregar columna 'key' a la tabla reservations para consistencia
-- Fecha: 2025-01-30

-- Agregar la columna key como TEXT opcional
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS "key" TEXT;

-- Agregar comentario para documentar el propósito
COMMENT ON COLUMN public.reservations."key" IS 'Columna para manejar propiedades extra de React (como key)';

-- Verificar que la columna se agregó correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'key'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Columna "key" agregada exitosamente a reservations';
    ELSE
        RAISE NOTICE '❌ Error: La columna "key" no se pudo agregar';
    END IF;
END $$; 