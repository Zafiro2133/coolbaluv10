-- Script rápido para diagnosticar y corregir problemas de storage
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar buckets de storage
SELECT 
  'BUCKETS' as info_type,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('product-images', 'category-images')
ORDER BY name;

-- 2. Verificar políticas de storage
SELECT 
  'POLICIES' as info_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Verificar archivos en product-images
SELECT 
  'FILES' as info_type,
  id,
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar URLs de productos
SELECT 
  'PRODUCT_URLS' as info_type,
  id,
  name,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'NO IMAGE'
    WHEN image_url = '' THEN 'EMPTY URL'
    WHEN image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%' THEN 'OBSOLETE URL'
    WHEN image_url LIKE '%rwgxdtfuzpdukaguogyh.supabase.co%' THEN 'CURRENT URL'
    ELSE 'UNKNOWN URL FORMAT'
  END as url_status
FROM public.products
WHERE image_url IS NOT NULL AND image_url != ''
ORDER BY created_at DESC
LIMIT 10;

-- 5. Crear políticas si no existen
DO $$
BEGIN
  -- Política para acceso público a imágenes de productos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Product images are publicly accessible'
  ) THEN
    CREATE POLICY "Product images are publicly accessible" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'product-images');
    RAISE NOTICE '✅ Política "Product images are publicly accessible" creada';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Product images are publicly accessible" ya existe';
  END IF;

  -- Política para acceso público a imágenes de categorías
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Category images are publicly accessible'
  ) THEN
    CREATE POLICY "Category images are publicly accessible" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'category-images');
    RAISE NOTICE '✅ Política "Category images are publicly accessible" creada';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Category images are publicly accessible" ya existe';
  END IF;
END $$;

-- 6. Verificar RLS en storage.objects
SELECT 
  'RLS_STATUS' as info_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 7. Verificar el archivo específico que está fallando
SELECT 
  'SPECIFIC_FILE' as info_type,
  id,
  name,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'product-images'
AND name LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%'
ORDER BY created_at DESC;

-- 8. Corregir URLs obsoletas si existen
UPDATE public.products 
SET image_url = REPLACE(image_url, 'https://tnqsdwqmdhgarwlhsijf.supabase.co/storage/v1/object/public/', 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/')
WHERE image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%';

UPDATE public.categories 
SET image_url = REPLACE(image_url, 'https://tnqsdwqmdhgarwlhsijf.supabase.co/storage/v1/object/public/', 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/')
WHERE image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%';

-- 9. Mostrar resumen de cambios
SELECT 
  'SUMMARY' as info_type,
  'URLs actualizadas' as action,
  'Verificar que las URLs usen el endpoint correcto' as description; 