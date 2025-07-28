-- Script para diagnosticar problemas de acceso a imágenes en Supabase Storage
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar configuración del proyecto
SELECT 
  'Project Info' as info_type,
  'Verificar en dashboard de Supabase' as project_id,
  'Configuración del proyecto no disponible via SQL' as project_ref;

-- 2. Verificar buckets de storage
SELECT 
  'Storage Buckets' as info_type,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name IN ('product-images', 'category-images')
ORDER BY name;

-- 3. Verificar políticas de storage para objetos
SELECT 
  'Storage Policies' as info_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 4. Verificar si existen objetos en el bucket product-images
SELECT 
  'Storage Objects' as info_type,
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar URLs de productos existentes
SELECT 
  'Product URLs' as info_type,
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

-- 6. Crear políticas de storage si no existen
-- (Descomentar si las políticas no existen)

-- Política para acceso público a imágenes de productos
DO $$
BEGIN
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
    
    RAISE NOTICE 'Política "Product images are publicly accessible" creada';
  ELSE
    RAISE NOTICE 'Política "Product images are publicly accessible" ya existe';
  END IF;
END $$;

-- Política para acceso público a imágenes de categorías
DO $$
BEGIN
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
    
    RAISE NOTICE 'Política "Category images are publicly accessible" creada';
  ELSE
    RAISE NOTICE 'Política "Category images are publicly accessible" ya existe';
  END IF;
END $$;

-- 7. Verificar permisos de RLS en storage.objects
SELECT 
  'RLS Status' as info_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 8. Función para probar acceso a una URL específica
CREATE OR REPLACE FUNCTION public.test_image_access(image_url TEXT)
RETURNS TABLE (
  url TEXT,
  is_accessible BOOLEAN,
  status_code INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta función simula una verificación de acceso
  -- En realidad, la verificación debe hacerse desde el cliente
  RETURN QUERY
  SELECT 
    image_url as url,
    CASE 
      WHEN image_url LIKE '%rwgxdtfuzpdukaguogyh.supabase.co%' THEN true
      ELSE false
    END as is_accessible,
    CASE 
      WHEN image_url LIKE '%rwgxdtfuzpdukaguogyh.supabase.co%' THEN 200
      ELSE 404
    END as status_code,
    CASE 
      WHEN image_url LIKE '%rwgxdtfuzpdukaguogyh.supabase.co%' THEN 'URL format looks correct'
      ELSE 'URL format may be incorrect'
    END as error_message;
END;
$$;

-- 9. Probar acceso a la URL específica del error
SELECT * FROM public.test_image_access('https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753706779843.png');

-- 10. Verificar si el archivo específico existe en storage
SELECT 
  'Specific File Check' as info_type,
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

-- 11. Comandos para verificar desde el dashboard de Supabase:
-- - Ir a Storage > product-images
-- - Verificar que el archivo existe
-- - Verificar que el bucket esté marcado como público
-- - Verificar las políticas de acceso 