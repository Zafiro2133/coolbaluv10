# 🗑️ Eliminación de Usuarios en Supabase - Guía Rápida

## 🚀 Inicio Rápido

### 1. Verificar el Sistema
```sql
-- Ejecuta en Supabase SQL Editor
\i scripts/verify-user-deletion.sql
```

### 2. Si hay problemas, aplicar corrección
```sql
-- Ejecuta en Supabase SQL Editor
\i scripts/fix-user-deletion.sql
```

### 3. Eliminar usuarios desde la aplicación
1. Ve al **Panel de Administración**
2. Navega a **Gestión de Usuarios**
3. Busca el usuario
4. Haz clic en **Eliminar** (botón rojo)
5. Confirma la eliminación

## 📋 Métodos Disponibles

### ✅ Método 1: Panel de Administración (Recomendado)
- **Ubicación**: Panel de Administración → Gestión de Usuarios
- **Ventajas**: Interfaz amigable, confirmación visual, estadísticas del usuario
- **Protección**: No permite eliminar administradores

### ✅ Método 2: Supabase Dashboard
- **Ubicación**: Supabase Dashboard → Authentication → Users
- **Ventajas**: Eliminación directa, sin restricciones
- **Desventajas**: No muestra estadísticas del usuario

### ✅ Método 3: SQL Directo
```sql
-- Eliminar usuario específico
DELETE FROM auth.users WHERE email = 'usuario@email.com';

-- Eliminar usuarios inactivos
DELETE FROM auth.users 
WHERE last_sign_in_at < NOW() - INTERVAL '90 days';
```

## 🔧 Configuración Automática

El sistema está configurado para eliminar automáticamente:
- ✅ Perfil del usuario (`profiles`)
- ✅ Roles asignados (`user_roles`)
- ✅ Reservas (`reservations`)
- ✅ Items de reservas (`reservation_items`)
- ✅ Registros de auditoría (`audit_log`)

## ⚠️ Advertencias Importantes

1. **Backup**: Siempre haz backup antes de eliminar usuarios importantes
2. **Administradores**: Los administradores tienen protección especial
3. **Datos perdidos**: La eliminación es permanente e irreversible
4. **Reservas**: Se perderán todas las reservas del usuario

## 🎯 Casos de Uso Comunes

### Eliminar Usuario Inactivo
1. Verifica que el usuario no tiene reservas importantes
2. Usa el panel de administración
3. Confirma la eliminación

### Eliminar Usuario con Muchas Reservas
1. Haz backup de los datos
2. Considera archivar en lugar de eliminar
3. Si es necesario, elimina desde Supabase Dashboard

### Eliminar Usuarios en Lote
```sql
-- Identificar usuarios inactivos
SELECT email, created_at, last_sign_in_at 
FROM auth.users 
WHERE last_sign_in_at < NOW() - INTERVAL '90 days';

-- Eliminar usuarios inactivos (¡CUIDADO!)
DELETE FROM auth.users 
WHERE last_sign_in_at < NOW() - INTERVAL '90 days'
AND email NOT LIKE '%@admin.com';
```

## 🔍 Verificación Post-Eliminación

```sql
-- Verificar que el usuario se eliminó
SELECT * FROM auth.users WHERE email = 'usuario@email.com';

-- Verificar que no quedan datos huérfanos
SELECT COUNT(*) FROM profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
```

## 📚 Documentación Completa

- **Guía Detallada**: `docs/GUIA_ELIMINACION_USUARIOS.md`
- **Script de Corrección**: `scripts/fix-user-deletion.sql`
- **Script de Verificación**: `scripts/verify-user-deletion.sql`
- **Solución de Problemas**: `docs/USER_DELETION_FIX.md`

## 🆘 Solución de Problemas

### Error: "Foreign key constraint violation"
```sql
-- Ejecuta el script de corrección
\i scripts/fix-user-deletion.sql
```

### Error: "Permission denied"
- Verifica que tienes permisos de administrador
- Usa la API key correcta

### Error: "User not found"
- Verifica que el email sea correcto
- Asegúrate de que el usuario existe

## 🎉 ¡Listo!

Con esta configuración puedes eliminar usuarios de forma segura y sin errores. El sistema maneja automáticamente todas las dependencias y mantiene la integridad de la base de datos. 