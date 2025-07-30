-- =====================================================
-- SCRIPT DE VERIFICACIÓN POST-LIMPIEZA
-- Verifica que la app funcione correctamente después de la limpieza
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABLAS ESENCIALES
-- =====================================================

-- Verificar que todas las tablas esenciales existen
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages') 
        THEN '✅ ESENCIAL - PRESENTE' 
        ELSE '❌ INNECESARIA - DEBERÍA ELIMINARSE' 
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR FUNCIONES ESENCIALES
-- =====================================================

-- Verificar que la función esencial existe
SELECT 
    proname as function_name,
    CASE 
        WHEN proname = 'update_updated_at_column' 
        THEN '✅ ESENCIAL - PRESENTE' 
        ELSE '❌ INNECESARIA - DEBERÍA ELIMINARSE' 
    END as estado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY proname;

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS ESENCIALES
-- =====================================================

-- Verificar políticas RLS para cada tabla esencial
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN tablename IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages') 
        THEN '✅ ESENCIAL' 
        ELSE '❌ INNECESARIA' 
    END as estado
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VERIFICAR BUCKETS DE STORAGE
-- =====================================================

-- Verificar que solo existe el bucket esencial
SELECT 
    id as bucket_name,
    CASE 
        WHEN id = 'product-images' 
        THEN '✅ ESENCIAL - PRESENTE' 
        ELSE '❌ INNECESARIO - DEBERÍA ELIMINARSE' 
    END as estado
FROM storage.buckets
ORDER BY id;

-- =====================================================
-- 5. VERIFICAR TRIGGERS ESENCIALES
-- =====================================================

-- Verificar triggers para actualización de timestamps
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    CASE 
        WHEN tgname LIKE '%update_updated_at%' 
        THEN '✅ ESENCIAL - PRESENTE' 
        ELSE '❌ INNECESARIO - DEBERÍA ELIMINARSE' 
    END as estado
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY table_name, trigger_name;

-- =====================================================
-- 6. VERIFICAR ÍNDICES ESENCIALES
-- =====================================================

-- Verificar índices en tablas esenciales
SELECT 
    t.tablename,
    i.indexname,
    CASE 
        WHEN t.tablename IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages') 
        THEN '✅ ESENCIAL' 
        ELSE '❌ INNECESARIO' 
    END as estado
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE i.schemaname = 'public' AND t.schemaname = 'public'
ORDER BY t.tablename, i.indexname;

-- =====================================================
-- 7. VERIFICAR RESTRICCIONES DE CLAVES FORÁNEAS
-- =====================================================

-- Verificar foreign keys en tablas esenciales
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE 
        WHEN tc.table_name IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages') 
        THEN '✅ ESENCIAL' 
        ELSE '❌ INNECESARIA' 
    END as estado
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 8. VERIFICAR DATOS DE PRUEBA
-- =====================================================

-- Verificar que hay datos en las tablas esenciales
SELECT 
    'categories' as tabla,
    COUNT(*) as registros
FROM categories
UNION ALL
SELECT 
    'products' as tabla,
    COUNT(*) as registros
FROM products
UNION ALL
SELECT 
    'zones' as tabla,
    COUNT(*) as registros
FROM zones
UNION ALL
SELECT 
    'contact_messages' as tabla,
    COUNT(*) as registros
FROM contact_messages
ORDER BY tabla;

-- =====================================================
-- 9. VERIFICAR PERMISOS DE USUARIOS
-- =====================================================

-- Verificar que los usuarios tienen permisos correctos
SELECT 
    grantee,
    table_name,
    privilege_type,
    CASE 
        WHEN table_name IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages') 
        THEN '✅ ESENCIAL' 
        ELSE '❌ INNECESARIO' 
    END as estado
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- =====================================================
-- 10. RESUMEN DE VERIFICACIÓN
-- =====================================================

-- Crear resumen de verificación
WITH verification_summary AS (
    SELECT 
        'TABLAS' as tipo,
        COUNT(*) as total,
        COUNT(CASE WHEN table_name IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages') THEN 1 END) as esenciales,
        COUNT(CASE WHEN table_name NOT IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages') THEN 1 END) as innecesarias
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    
    UNION ALL
    
    SELECT 
        'FUNCIONES' as tipo,
        COUNT(*) as total,
        COUNT(CASE WHEN proname = 'update_updated_at_column' THEN 1 END) as esenciales,
        COUNT(CASE WHEN proname != 'update_updated_at_column' THEN 1 END) as innecesarias
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    
    UNION ALL
    
    SELECT 
        'BUCKETS' as tipo,
        COUNT(*) as total,
        COUNT(CASE WHEN id = 'product-images' THEN 1 END) as esenciales,
        COUNT(CASE WHEN id != 'product-images' THEN 1 END) as innecesarias
    FROM storage.buckets
)
SELECT 
    tipo,
    total,
    esenciales,
    innecesarias,
    CASE 
        WHEN esenciales > 0 AND innecesarias = 0 THEN '✅ PERFECTO'
        WHEN esenciales > 0 AND innecesarias > 0 THEN '⚠️ TIENE ELEMENTOS INNECESARIOS'
        WHEN esenciales = 0 THEN '❌ FALTAN ELEMENTOS ESENCIALES'
        ELSE '❓ ESTADO DESCONOCIDO'
    END as estado
FROM verification_summary
ORDER BY tipo; 