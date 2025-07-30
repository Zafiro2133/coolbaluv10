# Guía de Limpieza de Supabase (VERSIÓN CORREGIDA)

Esta guía te ayudará a eliminar elementos innecesarios de Supabase manteniendo **TODOS** los elementos esenciales para el correcto funcionamiento de la aplicación Coolbalu.

## ⚠️ ADVERTENCIA IMPORTANTE

**ANTES DE PROCEDER:**
1. Haz un backup completo de tu base de datos
2. Ejecuta esto en un entorno de desarrollo primero
3. Verifica que la app funcione correctamente después de la limpieza

## 🔧 SOLUCIÓN AL ERROR DE DEPENDENCIAS

Si encuentras el error:
```
ERROR: 2BP01: cannot drop function has_role(uuid,text) because other objects depend on it
```

**Solución:** El script actualizado ya maneja este problema eliminando primero las políticas que dependen de `has_role()` y luego recreando las políticas esenciales de forma más simple.

## 📋 Elementos a Eliminar (CORREGIDO)

### 1. Funciones Innecesarias
- `is_admin_user()` - No se usa
- `get_system_setting()` - No se usa
- `get_system_settings_for_user()` - No se usa
- `update_system_setting_secure()` - No se usa
- `update_system_settings_updated_at()` - No se usa

### 2. Migraciones Innecesarias (10 archivos)
- Configuraciones de S3 storage (la app usa Cloudinary)
- Políticas de storage innecesarias
- Scripts de debugging y testing
- Migraciones de system_settings que se pueden consolidar

### 3. Scripts Innecesarios (19 archivos)
- Scripts de storage (la app usa Cloudinary)
- Scripts de testing y debugging
- Scripts de políticas consolidables

## ✅ Elementos que SE MANTIENEN (CORREGIDO)

### Tablas Esenciales (11 tablas)
- `categories` - Catálogo de productos
- `products` - Productos del catálogo
- `profiles` - Información de usuarios
- `reservations` - Reservas
- `reservation_items` - Items de las reservas
- `zones` - Zonas de cobertura
- `contact_messages` - Mensajes de contacto
- `cart_items` - **Carrito de compras (SE USA)**
- `user_roles` - **Control de acceso admin (SE USA)**
- `availabilities` - **Gestión de disponibilidades (SE USA)**
- `system_settings` - **Configuración del sistema (SE USA)**

### Funciones Esenciales (3 funciones)
- `update_updated_at_column()` - Actualización automática de timestamps
- `has_role()` - **Verificar roles de usuario (SE USA)**
- `get_current_user_role()` - **Obtener rol del usuario actual (SE USA)**

### Buckets de Storage Esenciales (1 bucket)
- `product-images` - Imágenes de productos

### Migraciones Esenciales (18 archivos)
- Configuración inicial básica
- Estructura de categorías y productos
- Estructura de zonas y reservas
- Políticas RLS esenciales
- Datos de zonas de Rosario
- **Tabla system_settings (SE USA)**
- **Tabla availabilities (SE USA)**

### Scripts Esenciales (2 archivos)
- `setup-database.sql` - Configuración inicial de la base de datos
- `recreate-essential-policies.sql` - Políticas RLS esenciales simplificadas

## 🚀 Pasos para la Limpieza

### Paso 1: Ejecutar Script de Limpieza de Base de Datos (CORREGIDO)

```sql
-- Ejecutar en Supabase SQL Editor
\i supabase/scripts/cleanup-database-corrected.sql
```

### Paso 1.5: Recrear Políticas RLS Esenciales

```sql
-- Ejecutar en Supabase SQL Editor
\i supabase/scripts/recreate-essential-policies.sql
```

### Paso 2: Eliminar Migraciones Innecesarias (CORREGIDO)

```bash
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
```

### Paso 3: Eliminar Scripts Innecesarios

```bash
# Eliminar scripts de storage innecesarios
rm supabase/scripts/cleanup-supabase-storage-policies.sql
rm supabase/scripts/setup-payment-proofs-bucket.sql
rm supabase/scripts/setup-image-upload-policies.sql
rm supabase/scripts/fix-storage-mime-types.sql
rm supabase/scripts/cleanup-temp-images.sql
rm supabase/scripts/fix-product-image-urls.sql
rm supabase/scripts/quick-storage-fix.sql
rm supabase/scripts/debug-storage-issue.sql
rm supabase/scripts/fix-storage-config.sql
rm supabase/scripts/configure-s3-storage.sql
rm supabase/scripts/fix-product-images-simple.sql
rm supabase/scripts/fix-product-images-final.sql

# Eliminar scripts de testing y debugging
rm supabase/scripts/test-simple-delete.sql
rm supabase/scripts/check-reservation-constraints.sql
rm supabase/scripts/test-reservation-delete.sql
rm supabase/scripts/check-temp-references.sql
rm supabase/scripts/fix-specific-temp-file.sql
rm supabase/scripts/check-specific-file.sql

# Eliminar scripts de políticas que se pueden consolidar
rm supabase/scripts/add-reservation-delete-policies.sql
```

### Paso 4: Verificar la Limpieza

```sql
-- Ejecutar en Supabase SQL Editor
\i supabase/scripts/verify-cleanup.sql
```

## 📊 Beneficios de la Limpieza (CORREGIDO)

### Reducción de Complejidad
- **90% menos archivos de scripts** (de 20 a 2)
- **36% menos migraciones** (de 28 a 18)
- **0 tablas menos** (se mantienen todas las necesarias)
- **5 funciones menos** (de 8 a 3)

### Mejoras de Rendimiento
- Menos consultas innecesarias
- Menos triggers innecesarios
- Menos políticas RLS innecesarias
- Base de datos más limpia

### Mantenimiento Simplificado
- Menos archivos que mantener
- Estructura más clara
- Menos dependencias
- Código más limpio

## 🔍 Verificación Post-Limpieza

Después de ejecutar la limpieza, verifica que:

1. **La app funciona correctamente**
2. **Todas las funcionalidades principales funcionan:**
   - Catálogo de productos
   - Sistema de reservas
   - Gestión de zonas
   - Mensajes de contacto
   - Autenticación de usuarios
   - **Carrito de compras**
   - **Panel de administración**
   - **Gestión de disponibilidades**
   - **Configuración del sistema**

3. **No hay errores en la consola**
4. **Las imágenes se cargan correctamente**
5. **Las reservas se crean y gestionan correctamente**
6. **El acceso de administradores funciona**

## 🚨 Si Algo Sale Mal

Si después de la limpieza algo no funciona:

1. **Restaura el backup** de la base de datos
2. **Revisa los logs** de la aplicación
3. **Ejecuta el script de verificación** para identificar problemas
4. **Verifica que todas las tablas esenciales existen**

## 📝 Notas Importantes

- La app usa **Cloudinary** para imágenes, no Supabase Storage
- No se necesita configuración de **S3** o **payment-proofs**
- **El sistema de roles SÍ se usa** en la app actual
- **Las disponibilidades SÍ se usan** para gestión de horarios
- **La configuración del sistema SÍ se usa** en el panel admin
- **El carrito de compras SÍ se usa** en la app

## 🎯 Resultado Final

Después de la limpieza tendrás una base de datos **más limpia y eficiente** manteniendo **TODOS** los elementos esenciales para el correcto funcionamiento de la aplicación Coolbalu. 