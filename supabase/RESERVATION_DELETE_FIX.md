# Solución para Eliminación de Reservas

## ⚠️ PROBLEMA IDENTIFICADO Y SOLUCIONADO

**Error encontrado**: `aggregate functions are not allowed in RETURNING`

**Solución aplicada**: Removido el uso de `.select('count')` en operaciones DELETE del hook `useDeleteReservation`.

## Problema Original
El botón de eliminar reserva aparece y muestra la confirmación, pero la reserva no se elimina de la lista.

## Causas Identificadas
1. **Error de sintaxis**: Uso incorrecto de `.select('count')` en operaciones DELETE
2. **Políticas RLS**: Faltan las políticas de RLS (Row Level Security) para permitir operaciones DELETE en las tablas `reservations` y `reservation_items`.

## Solución

### Paso 1: Ejecutar las Políticas de Eliminación

Ve al **SQL Editor** de Supabase y ejecuta el siguiente script:

```sql
-- Agregar políticas de DELETE para reservas
-- 1. Política para que los admins puedan eliminar reservas
CREATE POLICY "Admins can delete reservations" 
ON public.reservations 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Política para que los admins puedan eliminar reservation_items
CREATE POLICY "Admins can delete reservation items" 
ON public.reservation_items 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Política para que los usuarios puedan eliminar sus propias reservas
CREATE POLICY "Users can delete their own reservations" 
ON public.reservations 
FOR DELETE 
USING (user_id = auth.uid());

-- 4. Política para que los usuarios puedan eliminar sus propios reservation_items
CREATE POLICY "Users can delete their own reservation items" 
ON public.reservation_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);
```

### Paso 2: Verificar que las Políticas se Crearon

Ejecuta este script para verificar:

```sql
-- Verificar políticas de eliminación
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_items')
AND cmd = 'DELETE'
ORDER BY tablename, policyname;
```

Deberías ver 4 políticas:
- `Admins can delete reservations`
- `Admins can delete reservation items`
- `Users can delete their own reservations`
- `Users can delete their own reservation items`

### Paso 3: Probar la Eliminación

1. Ve al panel de administración
2. Intenta eliminar una reserva
3. Verifica en la consola del navegador si hay errores
4. La reserva debería desaparecer de la lista

## Diagnóstico de Problemas

### Si aún no funciona, ejecuta estos scripts de diagnóstico:

#### 1. Verificar RLS y Políticas
```sql
-- Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('reservations', 'reservation_items')
AND schemaname = 'public';

-- Verificar todas las políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd, policyname;
```

#### 2. Verificar Función has_role
```sql
-- Verificar si la función has_role existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'has_role'
AND routine_schema = 'public';

-- Probar la función
SELECT public.has_role(auth.uid(), 'admin') as is_admin;
```

#### 3. Verificar Foreign Keys
```sql
-- Verificar si hay foreign keys que impidan eliminación
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'reservations';
```

## Logs de Debug

El código ahora incluye logs detallados. Para ver los errores:

1. Abre las **Developer Tools** del navegador
2. Ve a la pestaña **Console**
3. Intenta eliminar una reserva
4. Revisa los mensajes de log para identificar el problema específico

## Posibles Errores Comunes

### Error: "aggregate functions are not allowed in RETURNING"
- **Solución**: No usar `.select('count')` en operaciones DELETE
- **Acción**: ✅ **SOLUCIONADO** - Removido el uso de `.select('count')` en el hook

### Error: "new row violates row-level security policy"
- **Solución**: Las políticas no están configuradas correctamente
- **Acción**: Ejecutar el script de políticas del Paso 1

### Error: "function has_role does not exist"
- **Solución**: La función has_role no está definida
- **Acción**: Verificar que la migración `20250120000000-fix-reservations-complete.sql` se ejecutó

### Error: "foreign key constraint"
- **Solución**: Hay foreign keys que impiden la eliminación
- **Acción**: Verificar las foreign keys con el script de diagnóstico

## Archivos Modificados

- `hooks/useAdmin.ts`: Mejorado con logging detallado
- `components/admin/ReservationManagement.tsx`: Ya incluye la funcionalidad de eliminación
- `supabase/scripts/add-reservation-delete-policies.sql`: Script para agregar políticas
- `supabase/scripts/test-reservation-delete.sql`: Script de diagnóstico
- `supabase/scripts/check-reservation-constraints.sql`: Script para verificar constraints

## Notas Importantes

1. **Siempre ejecuta las políticas en el orden correcto**: primero `reservation_items`, luego `reservations`
2. **Verifica que el usuario tenga rol de admin**: La función `has_role` debe retornar `true`
3. **Revisa los logs de la consola**: Contienen información detallada sobre errores
4. **Las políticas son acumulativas**: Si ya existen políticas de DELETE, no se duplicarán 