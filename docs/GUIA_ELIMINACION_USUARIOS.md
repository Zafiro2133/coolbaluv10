# Guía Completa: Eliminación de Usuarios en Supabase

## 🎯 Objetivo
Esta guía te ayudará a eliminar usuarios de Supabase de forma segura y correcta, evitando errores comunes.

## ⚠️ Advertencias Importantes

### Antes de Eliminar Usuarios:
1. **Haz un backup completo** de tu base de datos
2. **Verifica las dependencias** del usuario (reservas, datos asociados)
3. **Considera desactivar** en lugar de eliminar para usuarios importantes
4. **Ejecuta en desarrollo primero** antes de aplicar en producción

## 🔧 Problema Común

Al intentar eliminar usuarios desde el panel de Supabase, aparece el error:
```
Failed to delete selected users: Database error deleting user
```

### Causa del Problema
Las foreign keys que referencian `auth.users(id)` sin `ON DELETE CASCADE` impiden la eliminación.

## 🛠️ Solución Paso a Paso

### Paso 1: Aplicar la Migración de Corrección

Ejecuta este script en el **SQL Editor** de Supabase:

```sql
-- Script para corregir la eliminación de usuarios en Supabase
-- ⚠️ ADVERTENCIA: Ejecuta esto en el SQL Editor de Supabase

-- Paso 1: Verificar el estado actual de las foreign keys
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ PERMITE ELIMINACIÓN'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ SET NULL'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOQUEA ELIMINACIÓN'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ BLOQUEA ELIMINACIÓN'
        ELSE '❓ DESCONOCIDO'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.referenced_table_name = 'users'
    AND kcu.referenced_table_schema = 'auth'
ORDER BY tc.table_name, kcu.column_name;

-- Paso 2: Corregir foreign key de audit_log (si existe)
DO $$
BEGIN
    -- Buscar y eliminar la constraint existente sin CASCADE
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'audit_log' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        EXECUTE (
            'ALTER TABLE public.audit_log DROP CONSTRAINT ' || 
            (SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'audit_log' 
             AND constraint_type = 'FOREIGN KEY'
             AND constraint_name LIKE '%user_id%'
             LIMIT 1)
        );
        
        -- Agregar la foreign key con CASCADE
        ALTER TABLE public.audit_log 
        ADD CONSTRAINT audit_log_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de audit_log corregida con CASCADE';
    ELSE
        RAISE NOTICE 'ℹ️ No se encontró foreign key de audit_log para corregir';
    END IF;
END $$;

-- Paso 3: Verificar que todas las tablas tengan CASCADE configurado
SELECT 
    tc.table_name,
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CORRECTO'
        ELSE '❌ NECESITA CORRECCIÓN'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('profiles', 'user_roles', 'reservations', 'reservation_items', 'audit_log')
    AND tc.constraint_name LIKE '%user_id%'
ORDER BY tc.table_name;
```

### Paso 2: Verificar la Configuración

Después de ejecutar el script, verifica que todas las tablas muestren `✅ CORRECTO` en la columna `status`.

## 🎮 Métodos para Eliminar Usuarios

### Método 1: Desde el Panel de Administración (Recomendado)

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Busca el usuario que quieres eliminar
3. Haz clic en el botón **Delete** (🗑️)
4. Confirma la eliminación

### Método 2: Desde la Interfaz de la Aplicación

1. Ve al **Panel de Administración** de tu aplicación
2. Navega a **Gestión de Usuarios**
3. Busca el usuario
4. Haz clic en el botón **Eliminar** (rojo)
5. Confirma en el diálogo de confirmación

### Método 3: Usando SQL Directo

```sql
-- Eliminar un usuario específico por email
DELETE FROM auth.users WHERE email = 'usuario@email.com';

-- Eliminar usuarios inactivos (más de 30 días)
DELETE FROM auth.users 
WHERE last_sign_in_at < NOW() - INTERVAL '30 days'
OR last_sign_in_at IS NULL;
```

### Método 4: Usando la API de Supabase

```javascript
// En tu aplicación
const { error } = await supabase.auth.admin.deleteUser(userId);

if (error) {
  console.error('Error al eliminar usuario:', error);
} else {
  console.log('Usuario eliminado exitosamente');
}
```

## 📊 Tablas que se Eliminan Automáticamente

Cuando eliminas un usuario, estas tablas se limpian automáticamente gracias a `ON DELETE CASCADE`:

- ✅ `profiles` - Perfil del usuario
- ✅ `user_roles` - Roles asignados
- ✅ `reservations` - Reservas del usuario
- ✅ `reservation_items` - Items de las reservas
- ✅ `audit_log` - Registros de auditoría (si existe)

## 🔍 Verificación Post-Eliminación

### Verificar que el Usuario se Eliminó

```sql
-- Verificar que el usuario ya no existe
SELECT * FROM auth.users WHERE email = 'usuario@email.com';

-- Verificar que no quedan datos huérfanos
SELECT COUNT(*) FROM profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
SELECT COUNT(*) FROM user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
SELECT COUNT(*) FROM reservations WHERE user_id NOT IN (SELECT id FROM auth.users);
```

### Verificar la Integridad de la Base de Datos

```sql
-- Verificar que no hay datos huérfanos en ninguna tabla
SELECT 
    'profiles' as table_name,
    COUNT(*) as orphaned_records
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'user_roles' as table_name,
    COUNT(*) as orphaned_records
FROM user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'reservations' as table_name,
    COUNT(*) as orphaned_records
FROM reservations r
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE u.id IS NULL;
```

## 🚨 Casos Especiales

### Eliminar Administradores

Los administradores tienen protección especial:
- No se pueden eliminar desde la interfaz de la aplicación
- Solo se pueden eliminar desde el panel de Supabase
- Considera cambiar su rol a "customer" antes de eliminar

### Eliminar Usuarios con Muchas Reservas

Para usuarios con muchas reservas:
1. **Haz un backup** de sus datos
2. **Exporta sus reservas** si son importantes
3. **Considera archivar** en lugar de eliminar

### Eliminar Usuarios Inactivos en Lote

```sql
-- Identificar usuarios inactivos
SELECT 
    email,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN last_sign_in_at IS NULL THEN 'Nunca inició sesión'
        ELSE 'Inactivo desde ' || last_sign_in_at::date
    END as status
FROM auth.users 
WHERE last_sign_in_at < NOW() - INTERVAL '30 days'
OR last_sign_in_at IS NULL
ORDER BY created_at DESC;

-- Eliminar usuarios inactivos (¡CUIDADO!)
DELETE FROM auth.users 
WHERE last_sign_in_at < NOW() - INTERVAL '90 days'
AND email NOT LIKE '%@admin.com'; -- Proteger emails de admin
```

## 🔧 Solución de Problemas

### Error: "Foreign key constraint violation"

```sql
-- Verificar qué tablas están bloqueando la eliminación
SELECT 
    tc.table_name,
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'audit_log'
    AND rc.delete_rule != 'CASCADE';
```

### Error: "Permission denied"

- Verifica que tienes permisos de administrador
- Asegúrate de estar usando la API key correcta
- Verifica las políticas RLS

### Error: "User not found"

- Verifica que el email o ID del usuario sea correcto
- Asegúrate de que el usuario existe en `auth.users`

## 📝 Mejores Prácticas

1. **Siempre haz backup** antes de eliminar usuarios importantes
2. **Usa la interfaz de administración** cuando sea posible
3. **Verifica las dependencias** antes de eliminar
4. **Documenta las eliminaciones** para auditoría
5. **Considera desactivar** en lugar de eliminar
6. **Prueba en desarrollo** antes de aplicar en producción

## 🎯 Resumen

Para eliminar usuarios de Supabase:

1. ✅ Aplica la migración de corrección de foreign keys
2. ✅ Verifica que todas las tablas tengan `CASCADE` configurado
3. ✅ Usa el panel de administración o la interfaz de la aplicación
4. ✅ Confirma la eliminación en el diálogo de confirmación
5. ✅ Verifica que el usuario se eliminó correctamente

¡Con estos pasos podrás eliminar usuarios de forma segura y sin errores! 