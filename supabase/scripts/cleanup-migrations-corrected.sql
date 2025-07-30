-- =====================================================
-- SCRIPT DE LIMPIEZA DE MIGRACIONES (VERSIÓN CORREGIDA)
-- Identifica migraciones innecesarias para eliminar
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script identifica migraciones que se pueden eliminar
-- Revisar cuidadosamente antes de eliminar archivos

-- =====================================================
-- MIGRACIONES QUE SE PUEDEN ELIMINAR (INNECESARIAS)
-- =====================================================

/*
MIGRACIONES A ELIMINAR:

1. 20250123000000-fix-business-hours-format.sql
   - Corrige formato de horarios de system_settings
   - Se puede consolidar con la migración inicial

2. 20250123000001-fix-system-settings-policies.sql
   - Corrige políticas de system_settings
   - Se puede consolidar con la migración inicial

3. 20250123000002-make-all-settings-public.sql
   - Hace públicas todas las configuraciones
   - Se puede consolidar con la migración inicial

4. 20250124000000-configure-s3-storage.sql
   - Configuración de S3 que no se usa
   - La app usa Cloudinary para imágenes

5. 20250125000000-fix-products-rls-policies.sql
   - Corrige políticas de productos
   - Se puede consolidar con la migración inicial

6. 20250125000001-fix-categories-rls-policies.sql
   - Corrige políticas de categorías
   - Se puede consolidar con la migración inicial

7. 20250125000002-configure-storage-policies.sql
   - Configuración de storage innecesaria
   - La app usa Cloudinary

8. 20250125000003-fix-reservation-items-trigger.sql
   - Trigger innecesario para reservation_items
   - Se puede manejar en la aplicación

9. 20250126000000-add-reservation-delete-policies.sql
   - Políticas de eliminación de reservas
   - Se puede consolidar con otras políticas

10. 20250127000000-add-payment-proof-upload.sql
    - Funcionalidad de upload de comprobantes
    - No se usa en la app actual

*/

-- =====================================================
-- MIGRACIONES ESENCIALES QUE SE MANTIENEN
-- =====================================================

/*
MIGRACIONES A MANTENER (ESENCIALES):

1. 20250715111146-1125d0bb-83b0-4002-adbe-8972f45fba31.sql
   - Configuración inicial básica
   - Función update_updated_at_column

2. 20250715111556-89f27c1d-1605-4164-97d0-4a933a7a0a97.sql
   - Estructura de categorías y productos
   - Bucket de product-images

3. 20250715112000-c0ae4120-eced-4fa8-bb23-71d3f9d38d09.sql
   - Estructura de zonas, carrito y reservas
   - Políticas RLS básicas

4. 20250715122850-56c435ae-14f1-47c3-8a58-055fdc0829d1.sql
   - Configuración inicial

5. 20250715123000_contact_messages.sql
   - Tabla de mensajes de contacto

6. 20250715123500_add_zone_coordinates.sql
   - Coordenadas de zonas

7. 20250116000000-update-rosario-zones.sql
   - Datos de zonas de Rosario

8. 20250116000001-fix-user-roles-policies.sql
   - Políticas de roles (SE USA)

9. 20250118000000-add-rain-reschedule-field.sql
   - Campo de reprogramación por lluvia

10. 20250118000001-fix-reservations-table.sql
    - Estructura completa de reservas

11. 20250118000002-create-required-functions.sql
    - Funciones necesarias

12. 20250118000003-fix-zone-id-type.sql
    - Tipo de ID de zona

13. 20250119000000-fix-reservations-policies.sql
    - Políticas de reservas

14. 20250120000000-fix-reservations-complete.sql
    - Corrección completa de reservas

15. 20250120000001-fix-reservations-foreign-keys.sql
    - Claves foráneas de reservas

16. 20250121000000-fix-extra-hours-field.sql
    - Campo de horas extra

17. 20250122000000-create-system-settings.sql
    - Tabla system_settings (SE USA)

18. 20250715124000_create_availabilities_table.sql
    - Tabla availabilities (SE USA)

*/

-- =====================================================
-- COMANDOS PARA ELIMINAR MIGRACIONES INNECESARIAS
-- =====================================================

/*
Para eliminar las migraciones innecesarias, ejecutar estos comandos:

# Eliminar migraciones de system_settings que se pueden consolidar
rm supabase/migrations/20250123000000-fix-business-hours-format.sql
rm supabase/migrations/20250123000001-fix-system-settings-policies.sql
rm supabase/migrations/20250123000002-make-all-settings-public.sql

# Eliminar migraciones de storage innecesarias
rm supabase/migrations/20250124000000-configure-s3-storage.sql
rm supabase/migrations/20250125000002-configure-storage-policies.sql

# Eliminar migraciones de políticas que se pueden consolidar
rm supabase/migrations/20250125000000-fix-products-rls-policies.sql
rm supabase/migrations/20250125000001-fix-categories-rls-policies.sql
rm supabase/migrations/20250126000000-add-reservation-delete-policies.sql

# Eliminar migraciones de funcionalidades no usadas
rm supabase/migrations/20250125000003-fix-reservation-items-trigger.sql
rm supabase/migrations/20250127000000-add-payment-proof-upload.sql

*/

-- =====================================================
-- VERIFICACIÓN POST-LIMPIEZA
-- =====================================================

-- Verificar que las tablas esenciales existen
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('categories', 'products', 'profiles', 'reservations', 'reservation_items', 'zones', 'contact_messages', 'cart_items', 'user_roles', 'availabilities', 'system_settings') 
        THEN '✅ ESENCIAL - PRESENTE' 
        ELSE '❌ INNECESARIA - DEBERÍA ELIMINARSE' 
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar que las funciones esenciales existen
SELECT 
    proname as function_name,
    CASE 
        WHEN proname IN ('update_updated_at_column', 'has_role', 'get_current_user_role') 
        THEN '✅ ESENCIAL - PRESENTE' 
        ELSE '❌ INNECESARIA - DEBERÍA ELIMINARSE' 
    END as estado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY proname; 