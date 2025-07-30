-- =====================================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS (VERSIÓN CORREGIDA)
-- Elimina elementos innecesarios manteniendo solo lo esencial
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script elimina datos y estructuras innecesarias
-- Ejecutar solo después de hacer backup completo de la base de datos

-- =====================================================
-- 1. ELIMINAR TABLAS INNECESARIAS
-- =====================================================

-- NO eliminar cart_items - SE USA en la app
-- NO eliminar user_roles - SE USA en la app  
-- NO eliminar availabilities - SE USA en la app
-- NO eliminar system_settings - SE USA en la app

-- =====================================================
-- 2. ELIMINAR FUNCIONES INNECESARIAS
-- =====================================================

-- Eliminar función is_admin_user (no se usa)
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Eliminar función get_system_setting (no se usa)
DROP FUNCTION IF EXISTS public.get_system_setting(VARCHAR);

-- Eliminar función get_system_settings_for_user (no se usa)
DROP FUNCTION IF EXISTS public.get_system_settings_for_user();

-- Eliminar función update_system_setting_secure (no se usa)
DROP FUNCTION IF EXISTS public.update_system_setting_secure(VARCHAR, TEXT);

-- Eliminar función update_system_settings_updated_at (no se usa)
DROP FUNCTION IF EXISTS public.update_system_settings_updated_at();

-- =====================================================
-- 3. ELIMINAR TRIGGERS INNECESARIOS
-- =====================================================

-- Eliminar trigger de system_settings (no se usa)
DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON public.system_settings;

-- =====================================================
-- 4. ELIMINAR POLÍTICAS RLS INNECESARIAS
-- =====================================================

-- Eliminar políticas de system_settings que no se usan
DROP POLICY IF EXISTS "admin_full_access_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_read_public_settings" ON public.system_settings;
DROP POLICY IF EXISTS "public_read_all_settings" ON public.system_settings;

-- =====================================================
-- 5. ELIMINAR ÍNDICES INNECESARIOS
-- =====================================================

-- Eliminar índices de system_settings que no se usan
DROP INDEX IF EXISTS idx_system_settings_key;
DROP INDEX IF EXISTS idx_system_settings_public;

-- =====================================================
-- 6. LIMPIAR STORAGE BUCKETS INNECESARIOS
-- =====================================================

-- Eliminar bucket de payment-proofs (no se usa)
DELETE FROM storage.buckets WHERE id = 'payment-proofs';

-- =====================================================
-- 7. VERIFICAR ESTRUCTURA FINAL
-- =====================================================

-- Mostrar tablas restantes
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Mostrar funciones restantes
SELECT 
    n.nspname as schema,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Mostrar políticas RLS restantes
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- RESUMEN DE LO QUE SE MANTIENE
-- =====================================================

/*
TABLAS ESENCIALES QUE SE MANTIENEN:
- categories: Para el catálogo de productos
- products: Para los productos del catálogo
- profiles: Para información de usuarios
- reservations: Para las reservas
- reservation_items: Para los items de las reservas
- zones: Para las zonas de cobertura
- contact_messages: Para mensajes de contacto
- cart_items: Para el carrito de compras (SE USA)
- user_roles: Para control de acceso admin (SE USA)
- availabilities: Para gestión de disponibilidades (SE USA)
- system_settings: Para configuración del sistema (SE USA)

FUNCIONES ESENCIALES QUE SE MANTIENEN:
- update_updated_at_column: Para actualizar timestamps automáticamente
- has_role: Para verificar roles de usuario (SE USA)
- get_current_user_role: Para obtener rol del usuario actual (SE USA)

BUCKETS DE STORAGE ESENCIALES:
- product-images: Para imágenes de productos

POLÍTICAS RLS ESENCIALES:
- Todas las políticas de las tablas que se mantienen
- Se eliminaron solo las políticas innecesarias de system_settings
*/ 