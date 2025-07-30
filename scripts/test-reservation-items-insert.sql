-- Script para probar la inserción de reservation_items
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar la estructura exacta de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservation_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si hay algún trigger que pueda estar causando problemas
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reservation_items'
AND trigger_schema = 'public';

-- 3. Probar inserción manual con datos de prueba
-- Primero necesitamos una reserva de prueba
INSERT INTO reservations (
    user_id,
    event_date,
    event_time,
    event_address,
    phone,
    adult_count,
    child_count,
    comments,
    rain_reschedule,
    extra_hours,
    subtotal,
    transport_cost,
    total,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- UUID de prueba
    '2025-01-30',
    '14:00:00',
    'Dirección de prueba',
    '1234567890',
    2,
    1,
    'Comentario de prueba',
    'no',
    3,
    1000.00,
    500.00,
    1500.00,
    'pending_payment'
) RETURNING id;

-- 4. Probar inserción de reservation_items
-- Reemplaza 'RESERVATION_ID_AQUI' con el ID devuelto por la inserción anterior
INSERT INTO reservation_items (
    reservation_id,
    product_id,
    product_name,
    product_price,
    quantity,
    extra_hours,
    extra_hour_percentage,
    item_total
) VALUES (
    'RESERVATION_ID_AQUI', -- Reemplazar con el ID real
    '00000000-0000-0000-0000-000000000001', -- UUID de producto de prueba
    'Producto de prueba',
    500.00,
    1,
    0,
    20.00,
    500.00
);

-- 5. Verificar que la inserción fue exitosa
SELECT * FROM reservation_items 
WHERE reservation_id = 'RESERVATION_ID_AQUI';

-- 6. Limpiar datos de prueba
DELETE FROM reservation_items WHERE reservation_id = 'RESERVATION_ID_AQUI';
DELETE FROM reservations WHERE id = 'RESERVATION_ID_AQUI'; 