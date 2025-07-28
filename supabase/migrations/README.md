# Migraciones de Base de Datos

Este directorio contiene las migraciones de Supabase que configuran la estructura completa de la base de datos.

## Orden de Ejecución

Las migraciones deben ejecutarse en orden cronológico (por timestamp). El orden correcto es:

### 1. Estructura Base (Julio 2025)
- `20250715111146-*` - Configuración inicial
- `20250715111556-*` - Estructura de usuarios
- `20250715112000-*` - Configuración de productos
- `20250715122850-*` - Configuración inicial
- `20250715123000_contact_messages.sql` - Tabla de mensajes de contacto
- `20250715123500_add_zone_coordinates.sql` - Coordenadas de zonas
- `20250715124000_create_availabilities_table.sql` - Tabla de disponibilidades

### 2. Configuración de Zonas (Enero 2025)
- `20250116000000-update-rosario-zones.sql` - Zonas de Rosario
- `20250116000001-fix-user-roles-policies.sql` - Políticas de roles

### 3. Sistema de Reservas (Enero 2025)
- `20250118000000-add-rain-reschedule-field.sql` - Campo de reprogramación por lluvia
- `20250118000001-fix-reservations-table.sql` - Estructura de reservas
- `20250118000002-create-required-functions.sql` - Funciones necesarias
- `20250118000003-fix-zone-id-type.sql` - Tipo de ID de zona
- `20250119000000-fix-reservations-policies.sql` - Políticas de reservas
- `20250120000000-fix-reservations-complete.sql` - Corrección completa de reservas
- `20250120000001-fix-reservations-foreign-keys.sql` - Claves foráneas

### 4. Configuración del Sistema (Enero 2025)
- `20250121000000-fix-extra-hours-field.sql` - Campo de horas extra
- `20250122000000-create-system-settings.sql` - Configuración del sistema
- `20250123000000-fix-business-hours-format.sql` - Formato de horarios
- `20250123000001-fix-system-settings-policies.sql` - Políticas de configuración
- `20250123000002-make-all-settings-public.sql` - Configuración pública

## Configuración Post-Migración

Después de ejecutar todas las migraciones, ejecuta el script de configuración:

```sql
-- Ejecutar en Supabase SQL Editor
\i supabase/scripts/setup-database.sql
```

Este script configura:
- Políticas de seguridad para availabilities
- Sistema de imágenes de productos
- Bucket de almacenamiento
- Función de limpieza de datos

## Verificación

Para verificar que todo está configurado correctamente:

1. **Políticas de seguridad**: Verificar que RLS está habilitado en todas las tablas
2. **Almacenamiento**: Confirmar que el bucket `product-images` existe
3. **Funciones**: Verificar que las funciones `has_role` y `update_updated_at_column` existen
4. **Datos**: Confirmar que las zonas de Rosario están configuradas

## Notas Importantes

- ⚠️ **Nunca ejecutes migraciones en producción sin hacer backup**
- ✅ Las migraciones son idempotentes (se pueden ejecutar múltiples veces)
- 🔒 Todas las tablas tienen Row Level Security (RLS) habilitado
- 📊 Las políticas aseguran acceso granular según roles de usuario 