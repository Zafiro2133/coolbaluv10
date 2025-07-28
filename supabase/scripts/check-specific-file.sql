-- Script para verificar el archivo específico que está fallando
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar el archivo específico en storage
SELECT 
  'SPECIFIC_FILE_CHECK' as info_type,
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata,
  CASE 
    WHEN name LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%' THEN 'ARCHIVO ENCONTRADO'
    ELSE 'ARCHIVO NO ENCONTRADO'
  END as file_status
FROM storage.objects
WHERE bucket_id = 'product-images'
AND (
  name LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%' OR
  name LIKE '%1753707362567%'
)
ORDER BY created_at DESC;

-- 2. Verificar todos los archivos del producto específico
SELECT 
  'PRODUCT_FILES' as info_type,
  id,
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'product-images'
AND name LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%'
ORDER BY created_at DESC;

-- 3. Verificar el producto en la base de datos
SELECT 
  'PRODUCT_DB_CHECK' as info_type,
  id,
  name,
  image_url,
  CASE 
    WHEN image_url LIKE '%1753707362567%' THEN 'URL COINCIDE'
    WHEN image_url LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%' THEN 'PRODUCTO COINCIDE'
    ELSE 'NO COINCIDE'
  END as url_status
FROM public.products
WHERE id = '19008e6d-76fe-4981-95e4-8b2dfac97970'
OR image_url LIKE '%1753707362567%'
OR image_url LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%';

-- 4. Verificar configuración del bucket
SELECT 
  'BUCKET_CONFIG' as info_type,
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name = 'product-images';

-- 5. Verificar políticas de storage
SELECT 
  'STORAGE_POLICIES' as info_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Product images%';

-- 6. Verificar si el archivo existe con diferentes nombres
SELECT 
  'FILE_SEARCH' as info_type,
  id,
  name,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'product-images'
AND (
  name LIKE '%1753707362567%' OR
  name LIKE '%19008e6d%' OR
  name LIKE '%.png'
)
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar URLs de productos que podrían estar mal formadas
SELECT 
  'URL_CHECK' as info_type,
  id,
  name,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'NULL'
    WHEN image_url = '' THEN 'EMPTY'
    WHEN image_url LIKE '%rwgxdtfuzpdukaguogyh.supabase.co%' THEN 'CORRECT_DOMAIN'
    WHEN image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%' THEN 'WRONG_DOMAIN'
    ELSE 'UNKNOWN_FORMAT'
  END as url_format
FROM public.products
WHERE image_url IS NOT NULL 
AND image_url != ''
ORDER BY updated_at DESC
LIMIT 10;

-- 8. Función para generar URL correcta
CREATE OR REPLACE FUNCTION public.generate_correct_image_url(file_path TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/' || file_path;
$$;

-- 9. Probar generación de URL
SELECT 
  'URL_GENERATION' as info_type,
  '19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png' as file_path,
  public.generate_correct_image_url('19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png') as generated_url;

-- 10. Verificar si hay archivos huérfanos (en storage pero no en DB)
SELECT 
  'ORPHAN_FILES' as info_type,
  o.id,
  o.name,
  o.created_at,
  CASE 
    WHEN p.id IS NULL THEN 'HUÉRFANO (no existe en DB)'
    ELSE 'VINCULADO'
  END as status
FROM storage.objects o
LEFT JOIN public.products p ON o.name LIKE '%' || p.id || '%'
WHERE o.bucket_id = 'product-images'
AND o.name LIKE '%19008e6d-76fe-4981-95e4-8b2dfac97970%'
ORDER BY o.created_at DESC; 