-- Script para verificar y corregir la configuración del storage
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar que los buckets existan y estén configurados correctamente
SELECT 
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('product-images', 'category-images')
ORDER BY name;

-- 2. Si los buckets no existen, crearlos
-- (Descomentar si es necesario)

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES 
--   ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
--   ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
-- ON CONFLICT (id) DO NOTHING;

-- 3. Verificar las políticas de storage
SELECT 
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

-- 4. Crear políticas si no existen
-- (Descomentar si es necesario)

-- CREATE POLICY "Product images are publicly accessible" 
-- ON storage.objects 
-- FOR SELECT 
-- USING (bucket_id = 'product-images');

-- CREATE POLICY "Category images are publicly accessible" 
-- ON storage.objects 
-- FOR SELECT 
-- USING (bucket_id = 'category-images');

-- 5. Verificar que las funciones de storage existan
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%storage%'
ORDER BY routine_name;

-- 6. Función para limpiar URLs de storage obsoletas
CREATE OR REPLACE FUNCTION public.cleanup_storage_urls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  products_updated INTEGER := 0;
  categories_updated INTEGER := 0;
BEGIN
  -- Actualizar URLs de productos que usen el endpoint incorrecto
  UPDATE public.products 
  SET image_url = REPLACE(image_url, 'https://tnqsdwqmdhgarwlhsijf.supabase.co/storage/v1/object/public/', 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/')
  WHERE image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%';
  
  GET DIAGNOSTICS products_updated = ROW_COUNT;
  
  -- Actualizar URLs de categorías que usen el endpoint incorrecto
  UPDATE public.categories 
  SET image_url = REPLACE(image_url, 'https://tnqsdwqmdhgarwlhsijf.supabase.co/storage/v1/object/public/', 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/')
  WHERE image_url LIKE '%tnqsdwqmdhgarwlhsijf.supabase.co%';
  
  GET DIAGNOSTICS categories_updated = ROW_COUNT;
  
  RETURN products_updated + categories_updated;
END;
$$;

-- 7. Función para verificar URLs de imágenes
CREATE OR REPLACE FUNCTION public.check_image_urls()
RETURNS TABLE (
  table_name TEXT,
  record_id UUID,
  image_url TEXT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar URLs de productos
  RETURN QUERY
  SELECT 
    'products'::TEXT as table_name,
    p.id as record_id,
    p.image_url,
    p.image_url IS NOT NULL AND p.image_url != '' as is_valid
  FROM public.products p
  WHERE p.image_url IS NOT NULL AND p.image_url != '';
  
  -- Verificar URLs de categorías
  RETURN QUERY
  SELECT 
    'categories'::TEXT as table_name,
    c.id as record_id,
    c.image_url,
    c.image_url IS NOT NULL AND c.image_url != '' as is_valid
  FROM public.categories c
  WHERE c.image_url IS NOT NULL AND c.image_url != '';
END;
$$;

-- 8. Ejecutar verificación de URLs
SELECT * FROM public.check_image_urls();

-- 9. Comentarios sobre la configuración
COMMENT ON FUNCTION public.cleanup_storage_urls IS 'Función para limpiar URLs de storage que usen endpoints obsoletos';
COMMENT ON FUNCTION public.check_image_urls IS 'Función para verificar que las URLs de imágenes sean válidas'; 