-- Script para verificar constraints y foreign keys de reservas
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar foreign keys que referencian reservations
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'reservations';

-- 2. Verificar foreign keys que referencian reservation_items
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'reservation_items';

-- 3. Verificar triggers en las tablas
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table IN ('reservations', 'reservation_items')
ORDER BY event_object_table, trigger_name;

-- 4. Verificar si hay datos de ejemplo para probar eliminación
SELECT 
    'reservations' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending_payment' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM reservations
UNION ALL
SELECT 
    'reservation_items' as table_name,
    COUNT(*) as total_count,
    NULL as pending_count,
    NULL as confirmed_count,
    NULL as cancelled_count
FROM reservation_items;

-- 5. Probar eliminación manual (comentado por seguridad)
-- DESCOMENTAR SOLO PARA PRUEBAS
/*
-- Probar eliminación de una reserva específica
-- Reemplazar 'reservation-id-aqui' con un ID real
DELETE FROM reservation_items WHERE reservation_id = 'reservation-id-aqui';
DELETE FROM reservations WHERE id = 'reservation-id-aqui';
*/ 