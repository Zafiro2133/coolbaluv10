# Configuración del Storage S3 en Supabase

## Información del Endpoint

- **URL del Endpoint**: `https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3`
- **Región**: `sa-east-1`
- **Proyecto ID**: `tnqsdwqmdhgarwlhsijf`

## Pasos de Configuración

### 1. Configuración en el Dashboard de Supabase

1. **Accede al Dashboard:**
   - Ve a https://supabase.com/dashboard/project/tnqsdwqmdhgarwlhsijf
   - Navega a **Settings > Storage**

2. **Configura el Storage Backend:**
   - Cambia "Storage Backend" de "Local" a **"S3"**
   - Configura los siguientes parámetros:
     - **S3 Endpoint**: `https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3`
     - **S3 Region**: `sa-east-1`
     - **S3 Access Key ID**: [Tu Access Key ID]
     - **S3 Secret Access Key**: [Tu Secret Access Key]
     - **S3 Bucket**: [Nombre del bucket principal]

3. **Guarda la Configuración:**
   - Haz clic en "Save" para aplicar los cambios
   - Espera a que la configuración se propague

### 2. Verificación de Buckets

Los siguientes buckets deben estar configurados y funcionando:

| Bucket | Tipo | Propósito | Políticas |
|--------|------|-----------|-----------|
| `product-images` | Público | Imágenes de productos | Lectura pública, escritura solo admins |
| `category-images` | Público | Imágenes de categorías | Lectura pública, escritura solo admins |
| `payment-proofs` | Privado | Comprobantes de pago | Solo usuarios autenticados |

### 3. Ejecución de Migraciones

Ejecuta las siguientes migraciones en orden:

```sql
-- 1. Migración principal de configuración S3
-- Ejecuta: supabase/migrations/20250124000000-configure-s3-storage.sql

-- 2. Script de configuración adicional
-- Ejecuta: supabase/scripts/configure-s3-storage.sql
```

### 4. Verificación de la Configuración

Después de configurar, ejecuta estas consultas para verificar:

```sql
-- Verificar configuración de buckets
SELECT * FROM public.check_storage_config();

-- Probar conectividad
SELECT * FROM public.test_storage_connection();

-- Ver estadísticas del storage
SELECT * FROM public.get_storage_stats();
```

## Funciones Helper Disponibles

### `public.check_storage_config()`
Verifica la configuración actual de todos los buckets.

### `public.get_storage_url(bucket_name, file_path)`
Genera URLs de storage con el endpoint personalizado.

**Ejemplo:**
```sql
SELECT public.get_storage_url('product-images', 'product-123.jpg');
-- Resultado: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/product-123.jpg
```

### `public.test_storage_connection()`
Prueba la conectividad de todos los buckets públicos.

### `public.get_storage_stats()`
Obtiene estadísticas detalladas del storage.

### `public.cleanup_storage_urls()`
Limpia URLs obsoletas en las tablas de productos y categorías.

### `public.cleanup_orphaned_files()`
Identifica archivos huérfanos (sin referencia en la base de datos).

## Troubleshooting

### Problema: Las imágenes no se cargan
**Solución:**
1. Verifica la configuración del endpoint S3
2. Confirma que las credenciales sean correctas
3. Ejecuta: `SELECT * FROM public.test_storage_connection();`

### Problema: Error de permisos al subir archivos
**Solución:**
1. Verifica que el usuario tenga rol de admin
2. Confirma que las políticas de storage estén aplicadas
3. Ejecuta: `SELECT * FROM public.check_storage_config();`

### Problema: URLs de imágenes incorrectas
**Solución:**
1. Ejecuta: `SELECT public.cleanup_storage_urls();`
2. Verifica que las URLs usen el endpoint correcto
3. Actualiza manualmente las URLs si es necesario

## Monitoreo

### Consultas Útiles para Monitoreo

```sql
-- Ver uso del storage por bucket
SELECT 
  bucket_name,
  total_files,
  pg_size_pretty(total_size) as total_size_formatted,
  avg_file_size
FROM public.get_storage_stats();

-- Ver archivos recientes
SELECT 
  o.name,
  b.name as bucket_name,
  o.created_at,
  pg_size_pretty((o.metadata->>'size')::bigint) as file_size
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
ORDER BY o.created_at DESC
LIMIT 10;

-- Ver archivos huérfanos
SELECT * FROM public.cleanup_orphaned_files();
```

## Seguridad

### Políticas de Acceso

- **Buckets públicos**: Solo lectura pública, escritura solo para admins
- **Buckets privados**: Solo acceso para usuarios autenticados
- **Archivos de pago**: Solo accesibles por el usuario propietario y admins

### Recomendaciones

1. **Rotación de credenciales**: Cambia las credenciales S3 regularmente
2. **Monitoreo**: Revisa las estadísticas del storage periódicamente
3. **Limpieza**: Ejecuta limpieza de archivos huérfanos mensualmente
4. **Backup**: Configura backup automático de los buckets importantes

## Contacto

Para problemas con la configuración del storage, contacta al administrador del sistema o abre un issue en el repositorio. 