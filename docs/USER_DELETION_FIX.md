# Solución: Error al Eliminar Usuarios en Supabase

## Problema
Al intentar eliminar usuarios desde el panel de Supabase, aparece el error:
```
Failed to delete selected users: Database error deleting user
```

## Causa del Problema
La tabla `audit_log` tiene una foreign key que referencia a `auth.users(id)` **SIN** `ON DELETE CASCADE`. Esto impide que se eliminen usuarios que tienen registros en la tabla de auditoría.

## Solución

### Paso 1: Ejecutar la Migración de Corrección
Ejecuta la siguiente migración en tu proyecto de Supabase:

```sql
-- Corregir foreign key de audit_log para permitir eliminación de usuarios
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
    END IF;
END $$;

-- Agregar la foreign key con CASCADE
ALTER TABLE public.audit_log 
ADD CONSTRAINT audit_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Paso 2: Verificar el Estado de las Foreign Keys
Ejecuta este script para verificar que todas las foreign keys estén configuradas correctamente:

```sql
-- Verificar todas las foreign keys que referencian a auth.users
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
```

### Paso 3: Limpiar Registros de Auditoría (Opcional)
Si aún tienes problemas después de la migración, puedes limpiar los registros de auditoría:

```sql
-- Eliminar registros de audit_log para un usuario específico
DELETE FROM public.audit_log 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'usuario@email.com'
);

-- O eliminar todos los registros de audit_log (NUCLEAR OPTION)
-- DELETE FROM public.audit_log;
```

## Verificación

### Después de aplicar la migración:
1. Ve al panel de Supabase → Authentication → Users
2. Intenta eliminar un usuario
3. Debería funcionar sin errores

### Si aún hay problemas:
1. Ejecuta el script de verificación de foreign keys
2. Identifica qué tablas tienen `RESTRICT` o `NO ACTION`
3. Aplica migraciones adicionales para corregir esas foreign keys

## Tablas que Deberían Tener CASCADE

Las siguientes tablas ya tienen `ON DELETE CASCADE` configurado correctamente:
- ✅ `profiles` - Se elimina automáticamente
- ✅ `user_roles` - Se elimina automáticamente  
- ✅ `reservations` - Se elimina automáticamente
- ✅ `reservation_items` - Se elimina automáticamente
- ✅ `audit_log` - **CORREGIDO** con esta migración

## Notas Importantes

- **Pérdida de Auditoría**: Al eliminar usuarios, se perderán los registros de auditoría asociados
- **Backup**: Considera hacer un backup antes de eliminar usuarios importantes
- **Alternativa**: En lugar de eliminar, considera desactivar usuarios cambiando su estado

## Comando de Verificación Rápida

```sql
-- Verificar que la migración se aplicó correctamente
SELECT 
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CORRECTO - Permite eliminación'
        ELSE '❌ PROBLEMA - No permite eliminación'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'audit_log' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name LIKE '%user_id%';
```

El resultado debería mostrar `CASCADE` en la columna `delete_rule` y "✅ CORRECTO" en la columna `status`. 