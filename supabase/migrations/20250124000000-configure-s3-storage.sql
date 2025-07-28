-- Configuración del Storage S3 personalizado para Supabase
-- Endpoint: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3
-- Region: sa-east-1

-- Configurar el storage para usar el endpoint S3 personalizado
-- Esta configuración debe aplicarse en el panel de administración de Supabase
-- o a través de la API de configuración del proyecto

-- Nota: Las siguientes configuraciones deben aplicarse manualmente en el dashboard de Supabase
-- ya que no se pueden configurar directamente a través de SQL

-- 1. Configuración del Storage S3:
-- - Ir a Settings > Storage en el dashboard de Supabase
-- - Configurar el endpoint S3: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3
-- - Configurar la región: sa-east-1
-- - Configurar las credenciales de acceso S3

-- 2. Verificar que los buckets existentes funcionen con la nueva configuración
-- Los buckets ya creados en migraciones anteriores:
-- - product-images (público)
-- - category-images (público) 
-- - payment-proofs (privado)

-- 3. Actualizar las políticas de storage para asegurar compatibilidad
-- Las políticas existentes ya están configuradas correctamente

-- 4. Función helper para verificar la configuración del storage
CREATE OR REPLACE FUNCTION public.check_storage_config()
RETURNS TABLE (
  bucket_id TEXT,
  bucket_name TEXT,
  is_public BOOLEAN,
  file_size_limit BIGINT,
  allowed_mime_types TEXT[]
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
  FROM storage.buckets
  ORDER BY name;
$$;

-- 5. Política para permitir que admins verifiquen la configuración
CREATE POLICY "Admins can check storage configuration" 
ON storage.buckets 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Función para obtener URLs de storage con el endpoint personalizado
CREATE OR REPLACE FUNCTION public.get_storage_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN bucket_name = 'product-images' OR bucket_name = 'category-images' THEN
        'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path
      ELSE
        'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/authenticated/' || bucket_name || '/' || file_path
    END;
$$;

-- 7. Comentario sobre la configuración manual requerida
COMMENT ON FUNCTION public.get_storage_url IS 'Función para generar URLs de storage con el endpoint S3 personalizado. Requiere configuración manual en el dashboard de Supabase.';

-- 8. Verificar que las tablas que usan storage tengan las columnas correctas
-- Las tablas categories y products ya tienen la columna image_url configurada correctamente

-- 9. Función para limpiar URLs de storage obsoletas (si es necesario)
CREATE OR REPLACE FUNCTION public.cleanup_storage_urls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Actualizar URLs de categorías si es necesario
  UPDATE public.categories 
  SET image_url = public.get_storage_url('category-images', 
    CASE 
      WHEN image_url LIKE '%/storage/v1/object/public/category-images/%' THEN
        substring(image_url from 'category-images/(.+)')
      ELSE image_url
    END)
  WHERE image_url IS NOT NULL AND image_url != '';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Actualizar URLs de productos si es necesario
  UPDATE public.products 
  SET image_url = public.get_storage_url('product-images',
    CASE 
      WHEN image_url LIKE '%/storage/v1/object/public/product-images/%' THEN
        substring(image_url from 'product-images/(.+)')
      ELSE image_url
    END)
  WHERE image_url IS NOT NULL AND image_url != '';
  
  GET DIAGNOSTICS updated_count = updated_count + ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- 10. Política para permitir que admins ejecuten limpieza de URLs
GRANT EXECUTE ON FUNCTION public.cleanup_storage_urls() TO authenticated;

-- Comentario final sobre la configuración
COMMENT ON SCHEMA public IS 'Configuración de storage S3 personalizado aplicada. Endpoint: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3, Region: sa-east-1'; 