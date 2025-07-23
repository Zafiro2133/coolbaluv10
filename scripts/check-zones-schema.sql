-- Verificar el esquema actual de la tabla zones
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'zones' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- También mostrar las zonas existentes
SELECT * FROM public.zones;
