# Scripts de Supabase

Este directorio contiene scripts SQL para gestionar la base de datos de Supabase.

## Scripts Disponibles

### 1. `apply-availabilities-policies.sql`
**Propósito**: Configurar políticas de seguridad para la tabla `availabilities`.

**Qué hace**:
- Verifica que la función `has_role` existe
- Elimina políticas existentes de `availabilities`
- Crea nuevas políticas específicas:
  - **SELECT**: Todos pueden ver las disponibilidades
  - **INSERT**: Solo admins pueden crear disponibilidades
  - **UPDATE**: Solo admins pueden modificar disponibilidades
  - **DELETE**: Solo admins pueden eliminar disponibilidades
- Habilita Row Level Security (RLS)
- Muestra las políticas creadas

**Cómo usar**:
1. Ir al SQL Editor de Supabase
2. Copiar y pegar el contenido del script
3. Ejecutar el script
4. Verificar que las políticas se crearon correctamente

### 2. `cleanup-data.sql`
**Propósito**: Limpiar datos antiguos e innecesarios de la base de datos.

**Qué hace**:
- Elimina disponibilidades de fechas pasadas (más de 30 días)
- Elimina mensajes de contacto antiguos (más de 6 meses)
- Elimina reservaciones canceladas antiguas (más de 1 año)
- Elimina usuarios inactivos (más de 6 meses, excluyendo admins)
- Muestra estadísticas de registros eliminados
- Muestra el estado actual de las tablas

**Cómo usar**:
1. Ir al SQL Editor de Supabase
2. Copiar y pegar el contenido del script
3. Ejecutar el script
4. Revisar los resultados de la limpieza

## Migraciones

### `20250117000000-fix-availabilities-policies.sql`
Migración automática que aplica las políticas de `availabilities` de manera más granular.

### `20250117000001-cleanup-supabase-data.sql`
Migración automática que limpia datos antiguos de manera segura.

## Notas Importantes

⚠️ **Advertencias**:
- Los scripts de limpieza eliminan datos permanentemente
- Siempre haz una copia de seguridad antes de ejecutar scripts de limpieza
- Los scripts están diseñados para ser seguros, pero revisa los criterios de eliminación

🔒 **Seguridad**:
- Las políticas aseguran que solo los admins puedan gestionar disponibilidades
- Los usuarios normales solo pueden ver las disponibilidades
- RLS está habilitado en todas las tablas relevantes

📊 **Monitoreo**:
- Los scripts muestran estadísticas antes y después de la ejecución
- Puedes verificar el estado de las políticas en cualquier momento
- Las migraciones se ejecutan automáticamente en el despliegue

## Comandos Útiles

Para verificar las políticas actuales:
```sql
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'availabilities'
ORDER BY policyname;
```

Para verificar el estado de RLS:
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('availabilities', 'reservations', 'contact_messages');
``` 