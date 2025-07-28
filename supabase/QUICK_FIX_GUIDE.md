# Guía Rápida: Solucionar Problema de Visualización de Imágenes

## Problema
Las imágenes se suben correctamente pero no se muestran (icono de imagen rota).

## Solución Rápida

### Paso 1: Ejecutar Script de Diagnóstico
1. Ve al **SQL Editor** de Supabase
2. Copia y pega el contenido de `supabase/scripts/quick-storage-fix.sql`
3. Ejecuta el script completo
4. Revisa los resultados

### Paso 2: Verificar en Dashboard de Supabase
1. Ve a **Storage** en el dashboard
2. Verifica que el bucket `product-images` esté marcado como **público**
3. Si no está marcado como público, márcalo

### Paso 3: Usar Botón de Debug
1. Ve al panel de administración de productos
2. Haz clic en **"Debug Storage"**
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña **Console**
5. Revisa los mensajes de debugging

## Verificaciones Específicas

### 1. Verificar Bucket
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'product-images';
```

**Resultado esperado:**
- `public` debe ser `true`
- `allowed_mime_types` debe incluir `image/jpeg`, `image/png`, `image/webp`

### 2. Verificar Políticas
```sql
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Product images%';
```

**Resultado esperado:**
- Debe existir la política `"Product images are publicly accessible"`
- `cmd` debe ser `SELECT`
- `qual` debe contener `bucket_id = 'product-images'`

### 3. Verificar Archivo Específico
```sql
SELECT id, name, bucket_id, created_at, updated_at
FROM storage.objects
WHERE bucket_id = 'product-images'
AND name LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%';
```

**Resultado esperado:**
- Debe mostrar el archivo específico que está fallando
- Si no aparece, el archivo no existe en el storage

## Problemas Comunes y Soluciones

### Problema 1: Bucket no es público
**Síntoma:** Error 403 Forbidden
**Solución:** Marcar bucket como público en dashboard de Supabase

### Problema 2: Políticas faltantes
**Síntoma:** Error 403 Forbidden
**Solución:** Ejecutar el script SQL que crea las políticas automáticamente

### Problema 3: Archivo no existe
**Síntoma:** Error 404 Not Found
**Solución:** Verificar que el archivo se subió correctamente

### Problema 4: URL incorrecta
**Síntoma:** Error 404 Not Found
**Solución:** El script SQL corrige URLs obsoletas automáticamente

### Problema 5: CORS
**Síntoma:** Error en consola del navegador sobre CORS
**Solución:** Verificar configuración de CORS en dashboard de Supabase

## Comandos de Verificación

### En el navegador (F12 > Console):
```javascript
// Probar acceso directo a la URL
fetch('https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753706779843.png', {method: 'HEAD'})
  .then(response => console.log('Status:', response.status))
  .catch(error => console.error('Error:', error));
```

### En Supabase SQL Editor:
```sql
-- Verificar configuración completa
SELECT 
  'BUCKET' as type,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE name = 'product-images'

UNION ALL

SELECT 
  'POLICY' as type,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Product images%';
```

## Pasos de Emergencia

Si nada funciona:

1. **Recrear bucket:**
   - Eliminar bucket `product-images` en dashboard
   - Crear nuevo bucket con mismo nombre
   - Marcar como público
   - Ejecutar script SQL para crear políticas

2. **Verificar variables de entorno:**
   ```env
   VITE_SUPABASE_URL=https://rwgxdtfuzpdukaguogyh.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```

3. **Contactar soporte:**
   - Compartir logs de consola
   - Compartir resultados del script SQL
   - Compartir configuración del dashboard

## Notas Importantes

- ✅ El script SQL es seguro y no elimina datos
- ✅ Las políticas se crean solo si no existen
- ✅ Las URLs se corrigen automáticamente
- ✅ El botón de debug no modifica nada, solo diagnostica

## Resultados Esperados

Después de ejecutar el script y verificar la configuración:

1. **Bucket público:** ✅
2. **Políticas creadas:** ✅
3. **URLs corregidas:** ✅
4. **Imágenes visibles:** ✅
5. **Sin errores en consola:** ✅ 