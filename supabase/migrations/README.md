# Migraciones de Base de Datos - Sistema Consolidado

Este directorio contiene las migraciones de Supabase que configuran la estructura completa de la base de datos.

## 🎯 Sistema Consolidado

A partir del **31 de enero de 2025**, todas las migraciones anteriores han sido consolidadas en un solo archivo:

### Archivo Principal
- **`20250131000007-consolidated-schema.sql`** - Estado completo de la base de datos

Este archivo contiene:
- ✅ Todas las tablas del sistema
- ✅ Funciones y triggers
- ✅ Políticas de seguridad (RLS)
- ✅ Configuración de storage
- ✅ Datos iniciales
- ✅ Índices para optimización

## 📋 Estructura de la Base de Datos

### Tablas Principales
- **`profiles`** - Perfiles de usuario
- **`user_roles`** - Roles y permisos
- **`categories`** - Categorías de productos
- **`products`** - Catálogo de productos
- **`availabilities`** - Disponibilidades de horarios
- **`contact_messages`** - Mensajes de contacto
- **`system_settings`** - Configuración del sistema
- **`cart_items`** - Carrito de compras
- **`reservations`** - Reservas de eventos
- **`reservation_items`** - Items de reserva
- **`audit_log`** - Log de auditoría
- **`email_logs`** - Log de emails enviados
- **`email_templates`** - Plantillas de email
- **`email_config`** - Configuración de email

### Funciones Principales
- **`has_role()`** - Verificar roles de usuario
- **`get_current_user_role()`** - Obtener rol actual
- **`calculate_item_total_with_extra_hours()`** - Calcular totales
- **`log_reservation_change()`** - Auditoría de cambios
- **`get_email_template()`** - Obtener plantillas de email
- **`get_system_setting()`** - Obtener configuración

### Triggers Automáticos
- Actualización de timestamps (`updated_at`)
- Cálculo automático de totales
- Creación automática de perfiles
- Auditoría de cambios
- Validación de datos

## 🚀 Instalación

### Para Nuevos Entornos
1. Ejecutar el archivo consolidado:
```sql
-- En Supabase SQL Editor
\i supabase/migrations/20250131000007-consolidated-schema.sql
```

### Para Entornos Existentes
Si ya tienes datos, hacer backup antes de aplicar:
```sql
-- Backup de datos existentes
pg_dump --data-only --table=public.* > backup_data.sql

-- Aplicar migración consolidada
\i supabase/migrations/20250131000007-consolidated-schema.sql
```

## 📝 Nuevas Migraciones

Para agregar nuevas funcionalidades, crear archivos con timestamps posteriores:

```sql
-- Ejemplo: supabase/migrations/20250131000008-add-new-feature.sql
-- Tu nueva migración aquí
```

### Convención de Nombres
- **Fecha**: `YYYYMMDDHHMMSS`
- **Descripción**: `descripción-de-la-migración.sql`
- **Ejemplo**: `20250131000008-add-payment-gateway.sql`

## 🔧 Configuración Post-Migración

### Verificación Automática
El archivo consolidado incluye verificación automática que muestra:
- ✅ Número de tablas creadas
- ✅ Número de funciones creadas
- ✅ Número de triggers configurados
- ✅ Número de políticas RLS configuradas

### Configuración Manual (si es necesaria)
```sql
-- Configurar usuario admin (reemplazar con email correcto)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'tu-email@ejemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 🔒 Seguridad

### Row Level Security (RLS)
- Todas las tablas tienen RLS habilitado
- Políticas granulares por rol de usuario
- Acceso público solo para datos necesarios
- Admins tienen acceso completo

### Storage Buckets
- **`product-images`** - Imágenes de productos (público)
- **`category-images`** - Imágenes de categorías (público)
- **`payment-proofs`** - Comprobantes de pago (privado)

## 📊 Datos Iniciales

El archivo consolidado incluye:
- Categorías de productos (Inflables, Catering, Mobiliario, Combos)
- Productos de ejemplo con precios
- Configuración del sistema (horarios, costos, etc.)
- Plantillas de email (confirmación, contacto, pago)
- Configuración de email

## ⚠️ Notas Importantes

- **Backup**: Siempre hacer backup antes de aplicar migraciones en producción
- **Idempotente**: Las migraciones se pueden ejecutar múltiples veces sin problemas
- **Compatibilidad**: El archivo consolidado es compatible con Supabase
- **Rollback**: Para rollback, usar el backup de datos existentes

## 🆘 Solución de Problemas

### Error: "relation already exists"
- Las migraciones usan `CREATE TABLE IF NOT EXISTS`
- No debería ocurrir, pero si pasa, es seguro ignorar

### Error: "function already exists"
- Las funciones usan `CREATE OR REPLACE FUNCTION`
- Se actualizarán automáticamente

### Error: "policy already exists"
- Las políticas usan `DROP POLICY IF EXISTS` antes de crear
- Se recrearán automáticamente

## 📞 Soporte

Para problemas con migraciones:
1. Verificar logs de Supabase
2. Revisar la verificación automática al final del archivo
3. Consultar la documentación de Supabase
4. Hacer backup y restaurar si es necesario 