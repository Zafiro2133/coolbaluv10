-- Script simple para probar eliminación de reservas
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar que hay reservas para eliminar
SELECT 
    id,
    event_date,
    status,
    created_at
FROM reservations 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verificar que hay reservation_items asociados
SELECT 
    ri.id,
    ri.reservation_id,
    ri.product_name,
    r.event_date
FROM reservation_items ri
JOIN reservations r ON ri.reservation_id = r.id
ORDER BY r.created_at DESC 
LIMIT 5;

-- 3. Probar eliminación manual (DESCOMENTAR SOLO PARA PRUEBAS)
-- Reemplazar 'RESERVATION-ID-AQUI' con un ID real de la consulta anterior
/*
-- Primero eliminar items
DELETE FROM reservation_items 
WHERE reservation_id = 'RESERVATION-ID-AQUI';

-- Luego eliminar la reserva
DELETE FROM reservations 
WHERE id = 'RESERVATION-ID-AQUI';

-- Verificar que se eliminó
SELECT COUNT(*) as remaining_reservations FROM reservations WHERE id = 'RESERVATION-ID-AQUI';
SELECT COUNT(*) as remaining_items FROM reservation_items WHERE reservation_id = 'RESERVATION-ID-AQUI';
*/ 