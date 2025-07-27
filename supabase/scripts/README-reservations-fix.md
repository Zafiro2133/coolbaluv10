# Corrección de Errores de Reservas - Supabase

## Problemas Identificados y Solucionados

### 1. **Error 400 - Foreign Key Incorrecta**
- **Problema**: La consulta `getReservationsAdmin` fallaba con error 400 por foreign key inexistente
- **Solución**: Corrección de la foreign key y fallback en el código

### 2. **Función `has_role` faltante**
- **Problema**: Las políticas de RLS usaban `public.has_role()` pero la función no existía
- **Solución**: Creación de la función `has_role` con parámetros correctos

### 3. **Políticas de RLS inconsistentes**
- **Problema**: Políticas duplicadas y conflictivas entre migraciones
- **Solución**: Eliminación de políticas existentes y recreación con lógica correcta

### 4. **Triggers faltantes**
- **Problema**: No se actualizaba automáticamente `updated_at` ni se calculaba `total`
- **Solución**: Creación de triggers para actualización automática

### 5. **Índices faltantes**
- **Problema**: Consultas lentas por falta de índices
- **Solución**: Creación de índices en columnas críticas

### 6. **Validaciones de datos**
- **Problema**: No había restricciones para valores negativos o inválidos
- **Solución**: Agregado de constraints CHECK

### 7. **Manejo de errores mejorado**
- **Problema**: Errores genéricos sin información útil
- **Solución**: Mejora en el manejo y logging de errores

## Archivos Creados/Modificados

### Nuevos Archivos:
- `supabase/migrations/20250120000000-fix-reservations-complete.sql` - Migración principal
- `supabase/migrations/20250120000001-fix-reservations-foreign-keys.sql` - Corrección de foreign keys
- `supabase/scripts/apply-reservations-fix.sql` - Script de aplicación
- `supabase/scripts/diagnose-reservations-error.sql` - Script de diagnóstico
- `supabase/scripts/README-reservations-fix.md` - Esta documentación

### Archivos Modificados:
- `pages/Reservation.tsx` - Mejorado manejo de errores
- `services/supabase/reservations.ts` - Agregado fallback para consultas con JOIN

## Cómo Aplicar la Corrección

### Opción 1: Usando Supabase CLI
```bash
# Navegar al directorio del proyecto
cd coolbaluv10

# Aplicar la migración
supabase db push

# Verificar el estado
supabase db diff
```

### Opción 2: Usando psql directamente
```bash
# Conectar a la base de datos
psql -h db.supabase.co -U postgres -d postgres

# Aplicar el script
\i supabase/scripts/apply-reservations-fix.sql
```

### Opción 3: Desde el Dashboard de Supabase
1. Ir a SQL Editor en el dashboard
2. Copiar y pegar el contenido de `20250120000000-fix-reservations-complete.sql`
3. Ejecutar la consulta

## Verificación Post-Corrección

### 1. Diagnóstico Rápido
```bash
# Ejecutar el script de diagnóstico
psql -h db.supabase.co -U postgres -d postgres -f supabase/scripts/diagnose-reservations-error.sql
```

### 2. Verificar Tablas
```sql
SELECT table_name, row_count 
FROM (
  SELECT 'reservations' as table_name, COUNT(*) as row_count FROM reservations
  UNION ALL
  SELECT 'reservation_items' as table_name, COUNT(*) as row_count FROM reservation_items
) t;
```

### 2. Verificar Políticas
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_items');
```

### 3. Verificar Funciones
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('has_role', 'update_updated_at_column', 'calculate_reservation_total');
```

### 4. Verificar Triggers
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('reservations', 'reservation_items');
```

## Funcionalidades Corregidas

### ✅ Creación de Reservas
- Validación de datos completa
- Cálculo automático de totales
- Manejo de errores detallado

### ✅ Políticas de Seguridad
- Usuarios solo ven sus propias reservas
- Admins pueden ver todas las reservas
- Validación de roles correcta

### ✅ Rendimiento
- Índices en columnas críticas
- Consultas optimizadas
- Triggers eficientes

### ✅ Integridad de Datos
- Constraints para valores válidos
- Referencias de clave foránea
- Actualización automática de timestamps

## Pruebas Recomendadas

1. **Crear una reserva como usuario normal**
2. **Verificar que solo ve sus propias reservas**
3. **Crear una reserva como admin**
4. **Verificar que el admin ve todas las reservas**
5. **Probar con datos inválidos (debería fallar)**
6. **Verificar que los totales se calculan automáticamente**

## Notas Importantes

- La migración es **idempotente** - se puede ejecutar múltiples veces sin problemas
- **No se pierden datos** existentes
- Las políticas se recrean completamente para evitar conflictos
- Se mantiene compatibilidad con el código existente

## Soporte

Si encuentras algún problema después de aplicar la corrección:

1. Revisar los logs de la consola del navegador
2. Verificar el estado de la base de datos con las consultas de verificación
3. Revisar que todas las funciones y triggers estén creados correctamente
4. Confirmar que las políticas de RLS están activas 