-- Verificar la estructura exacta de la tabla reservation_items
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservation_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si hay algún trigger o función que pueda estar causando problemas
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reservation_items'
AND trigger_schema = 'public';

-- Verificar las políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reservation_items'
AND schemaname = 'public'; 