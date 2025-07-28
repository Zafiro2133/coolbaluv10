# Solución de Problemas de Visualización de Imágenes

## Problema
Las imágenes se suben correctamente al storage de Supabase pero no se muestran en la interfaz (icono de imagen rota).

## Causas Posibles

### 1. Configuración del Storage
- El bucket `product-images` no está configurado como público
- Las políticas de storage no permiten acceso público
- El endpoint de storage está mal configurado

### 2. URLs Incorrectas
- Las URLs generadas usan un endpoint obsoleto
- Las URLs no incluyen el dominio correcto de Supabase

### 3. Problemas de CORS
- El navegador bloquea las imágenes por políticas de CORS
- Las políticas de storage no incluyen los headers correctos

## Soluciones

### Paso 1: Verificar Configuración del Storage

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Verificar buckets
SELECT 
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('product-images', 'category-images')
ORDER BY name;
```

**Resultado esperado:**
- `product-images` debe existir y `is_public` debe ser `true`
- `category-images` debe existir y `is_public` debe ser `true`

### Paso 2: Verificar Políticas de Storage

```sql
-- Verificar políticas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;
```

**Políticas requeridas:**
- `Product images are publicly accessible` para `SELECT` en `bucket_id = 'product-images'`
- `Category images are publicly accessible` para `SELECT` en `bucket_id = 'category-images'`

### Paso 3: Crear Políticas si Faltan

```sql
-- Crear políticas para acceso público
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Category images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-images');
```

### Paso 4: Verificar URLs de Imágenes

```sql
-- Verificar URLs existentes
SELECT 
  'products' as table_name,
  id,
  image_url,
  CASE 
    WHEN image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%' THEN 'URL OBSOLETA'
    WHEN image_url LIKE '%rwgxdtfuzpdukaguogyh.supabase.co%' THEN 'URL CORRECTA'
    ELSE 'URL DESCONOCIDA'
  END as url_status
FROM public.products
WHERE image_url IS NOT NULL AND image_url != '';

SELECT 
  'categories' as table_name,
  id,
  image_url,
  CASE 
    WHEN image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%' THEN 'URL OBSOLETA'
    WHEN image_url LIKE '%rwgxdtfuzpdukaguogyh.supabase.co%' THEN 'URL CORRECTA'
    ELSE 'URL DESCONOCIDA'
  END as url_status
FROM public.categories
WHERE image_url IS NOT NULL AND image_url != '';
```

### Paso 5: Corregir URLs Obsoletas

Si encuentras URLs obsoletas, ejecuta:

```sql
-- Corregir URLs de productos
UPDATE public.products 
SET image_url = REPLACE(image_url, 'https://tnqsdwqmdhgarwlhsijf.supabase.co/storage/v1/object/public/', 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/')
WHERE image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%';

-- Corregir URLs de categorías
UPDATE public.categories 
SET image_url = REPLACE(image_url, 'https://tnqsdwqmdhgarwlhsijf.supabase.co/storage/v1/object/public/', 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/')
WHERE image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%';
```

### Paso 6: Verificar Configuración del Cliente

Asegúrate de que las variables de entorno estén configuradas correctamente:

```env
VITE_SUPABASE_URL=https://rwgxdtfuzpdukaguogyh.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Paso 7: Probar Acceso Directo

Intenta acceder directamente a una URL de imagen en el navegador:

```
https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/[product_id]/[filename]
```

Si la imagen no se carga, el problema está en la configuración del storage.

## Verificación en el Código

El componente `ImageWithFallback` ahora incluye:

1. **Manejo de errores**: Muestra un icono de fallback cuando la imagen no se puede cargar
2. **Logging**: Registra errores en la consola para debugging
3. **Indicador de carga**: Muestra un spinner mientras la imagen se está cargando

## Comandos de Debugging

### En el navegador:
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Busca mensajes que empiecen con:
   - `=== INICIO SUBIDA DE ARCHIVO ===`
   - `🔍 Verificando configuración del storage...`
   - `❌ Error al cargar imagen:`

### En Supabase:
1. Ve a Storage en el dashboard
2. Verifica que el bucket `product-images` esté configurado como público
3. Verifica que las políticas permitan acceso público

## Script Automatizado

Ejecuta el script `fix-storage-config.sql` en el SQL Editor de Supabase para:

1. Verificar la configuración actual
2. Crear políticas faltantes
3. Corregir URLs obsoletas
4. Verificar que todo esté funcionando

## Contacto

Si el problema persiste después de seguir estos pasos, verifica:

1. Los logs de la consola del navegador
2. La configuración del proyecto en el dashboard de Supabase
3. Las políticas de CORS en la configuración del storage 