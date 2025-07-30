-- =====================================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- Elimina elementos innecesarios manteniendo solo lo esencial
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script elimina datos y estructuras innecesarias
-- Ejecutar solo después de hacer backup completo de la base de datos

-- =====================================================
-- 1. ELIMINAR TABLAS INNECESARIAS
-- =====================================================

-- Eliminar tabla cart_items (no se usa en la app actual)
DROP TABLE IF EXISTS public.cart_items CASCADE;

-- Eliminar tabla user_roles (no se usa en la app actual)
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Eliminar tabla availabilities (no se usa en la app actual)
DROP TABLE IF EXISTS public.availabilities CASCADE;

-- =====================================================
-- 2. ELIMINAR POLÍTICAS RLS INNECESARIAS PRIMERO
-- =====================================================

-- Eliminar políticas de system_settings (no se usa)
DROP POLICY IF EXISTS "admin_full_access_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_read_public_settings" ON public.system_settings;
DROP POLICY IF EXISTS "public_read_all_settings" ON public.system_settings;

-- Eliminar políticas de user_roles (no se usa)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Eliminar políticas de availabilities (no se usa)
DROP POLICY IF EXISTS "Availabilities are viewable by everyone" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can manage availabilities" ON public.availabilities;

-- Eliminar políticas de cart_items (no se usa)
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

-- Eliminar políticas que dependen de has_role() (se reemplazarán con políticas más simples)
DROP POLICY IF EXISTS "Admins pueden modificar configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can view all reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can insert all reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can update all reservation items" ON public.reservation_items;

-- =====================================================
-- 3. ELIMINAR FUNCIONES INNECESARIAS
-- =====================================================

-- Eliminar función has_role (no se usa después de eliminar las políticas)
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);

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
-- 4. ELIMINAR TRIGGERS INNECESARIOS
-- =====================================================

-- Eliminar trigger de system_settings (no se usa)
DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON public.system_settings;

-- =====================================================
-- 5. ELIMINAR ÍNDICES INNECESARIOS
-- =====================================================

-- Eliminar índices de system_settings (no se usa)
DROP INDEX IF EXISTS idx_system_settings_key;
DROP INDEX IF EXISTS idx_system_settings_public;

-- =====================================================
-- 6. ELIMINAR DATOS INNECESARIOS
-- =====================================================

-- Eliminar datos de system_settings (no se usa)
DELETE FROM public.system_settings;

-- Eliminar datos de user_roles (no se usa)
DELETE FROM public.user_roles;

-- Eliminar datos de availabilities (no se usa)
DELETE FROM public.availabilities;

-- Eliminar datos de cart_items (no se usa)
DELETE FROM public.cart_items;

-- =====================================================
-- 7. ELIMINAR TABLA SYSTEM_SETTINGS COMPLETA
-- =====================================================

-- Eliminar tabla system_settings (no se usa en la app actual)
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- =====================================================
-- 8. LIMPIAR STORAGE BUCKETS INNECESARIOS
-- =====================================================

-- Eliminar bucket de payment-proofs (no se usa)
DELETE FROM storage.buckets WHERE id = 'payment-proofs';

-- =====================================================
-- 9. VERIFICAR ESTRUCTURA FINAL
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

FUNCIONES ESENCIALES QUE SE MANTIENEN:
- update_updated_at_column: Para actualizar timestamps automáticamente

BUCKETS DE STORAGE ESENCIALES:
- product-images: Para imágenes de productos

POLÍTICAS RLS ESENCIALES:
- Todas las políticas de las tablas que se mantienen
- Se eliminaron las políticas que dependían de has_role()
- Las políticas de admin se manejarán de forma más simple
*/ 