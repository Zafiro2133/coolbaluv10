-- Script para configurar manualmente el Storage S3 en Supabase
-- Este script debe ejecutarse después de configurar el endpoint S3 en el dashboard

-- Configuración del endpoint S3 personalizado:
-- URL: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3
-- Region: sa-east-1

-- 1. Verificar que los buckets existan y estén configurados correctamente
SELECT 
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY name;

-- 2. Verificar las políticas de storage existentes
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

-- 3. Función para verificar la conectividad del storage
CREATE OR REPLACE FUNCTION public.test_storage_connection()
RETURNS TABLE (
  bucket_name TEXT,
  is_accessible BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_record RECORD;
  test_file_path TEXT;
  test_result BOOLEAN;
BEGIN
  FOR bucket_record IN 
    SELECT id, name FROM storage.buckets 
    WHERE public = true
  LOOP
    test_file_path := 'test-connection-' || gen_random_uuid()::text || '.txt';
    
    BEGIN
      -- Intentar insertar un archivo de prueba
      INSERT INTO storage.objects (bucket_id, name, metadata)
      VALUES (bucket_record.id, test_file_path, '{"test": true}'::jsonb);
      
      -- Si llega aquí, la inserción fue exitosa
      test_result := true;
      
      -- Limpiar el archivo de prueba
      DELETE FROM storage.objects 
      WHERE bucket_id = bucket_record.id AND name = test_file_path;
      
    EXCEPTION WHEN OTHERS THEN
      test_result := false;
    END;
    
    bucket_name := bucket_record.name;
    is_accessible := test_result;
    error_message := CASE WHEN test_result THEN NULL ELSE 'Error de conexión al bucket' END;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 4. Función para obtener estadísticas del storage
CREATE OR REPLACE FUNCTION public.get_storage_stats()
RETURNS TABLE (
  bucket_name TEXT,
  total_files BIGINT,
  total_size BIGINT,
  avg_file_size BIGINT,
  oldest_file TIMESTAMP WITH TIME ZONE,
  newest_file TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    b.name as bucket_name,
    COUNT(o.id) as total_files,
    COALESCE(SUM((o.metadata->>'size')::bigint), 0) as total_size,
    COALESCE(AVG((o.metadata->>'size')::bigint), 0) as avg_file_size,
    MIN(o.created_at) as oldest_file,
    MAX(o.created_at) as newest_file
  FROM storage.buckets b
  LEFT JOIN storage.objects o ON b.id = o.bucket_id
  GROUP BY b.id, b.name
  ORDER BY b.name;
$$;

-- 5. Función para limpiar archivos huérfanos (archivos sin referencia en la base de datos)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_files()
RETURNS TABLE (
  bucket_name TEXT,
  orphaned_count BIGINT,
  cleaned_files TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_record RECORD;
  orphaned_record RECORD;
  orphaned_files TEXT[] := '{}';
  total_orphaned BIGINT := 0;
BEGIN
  FOR bucket_record IN 
    SELECT id, name FROM storage.buckets
  LOOP
    -- Buscar archivos que no están referenciados en las tablas
    FOR orphaned_record IN
      SELECT o.name
      FROM storage.objects o
      WHERE o.bucket_id = bucket_record.id
      AND NOT EXISTS (
        SELECT 1 FROM public.categories c 
        WHERE c.image_url LIKE '%' || o.name
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.products p 
        WHERE p.image_url LIKE '%' || o.name
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.reservations r 
        WHERE r.payment_proof_url LIKE '%' || o.name
      )
    LOOP
      orphaned_files := array_append(orphaned_files, orphaned_record.name);
      total_orphaned := total_orphaned + 1;
    END LOOP;
    
    bucket_name := bucket_record.name;
    orphaned_count := total_orphaned;
    cleaned_files := orphaned_files;
    
    RETURN NEXT;
    
    -- Resetear arrays para el siguiente bucket
    orphaned_files := '{}';
    total_orphaned := 0;
  END LOOP;
END;
$$;

-- 6. Políticas para permitir que admins ejecuten estas funciones
GRANT EXECUTE ON FUNCTION public.test_storage_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_storage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_files() TO authenticated;

-- 7. Comentarios sobre la configuración manual requerida
COMMENT ON FUNCTION public.test_storage_connection IS 'Función para probar la conectividad del storage S3. Requiere configuración previa en el dashboard de Supabase.';
COMMENT ON FUNCTION public.get_storage_stats IS 'Función para obtener estadísticas del storage. Útil para monitoreo.';
COMMENT ON FUNCTION public.cleanup_orphaned_files IS 'Función para limpiar archivos huérfanos del storage. Usar con precaución.';

-- 8. Instrucciones para configuración manual en el dashboard de Supabase:
/*
PASOS PARA CONFIGURAR EL STORAGE S3 EN EL DASHBOARD DE SUPABASE:

1. Ir a https://supabase.com/dashboard/project/[tu-project-id]
2. Navegar a Settings > Storage
3. En la sección "Storage Configuration":
   - Configurar "Storage Backend" como "S3"
   - Configurar "S3 Endpoint" como: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3
   - Configurar "S3 Region" como: sa-east-1
   - Configurar las credenciales de acceso S3 (Access Key ID y Secret Access Key)
   - Configurar "S3 Bucket" con el nombre del bucket principal

4. Guardar la configuración

5. Verificar que los buckets existentes funcionen:
   - product-images
   - category-images
   - payment-proofs

6. Probar la subida de archivos desde la aplicación

NOTA: Esta configuración debe hacerse manualmente ya que no se puede configurar a través de SQL.
*/

-- 9. Query para verificar la configuración actual
SELECT 
  'Configuración actual del Storage' as info,
  'Endpoint S3: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/s3' as endpoint,
  'Region: sa-east-1' as region,
  'Buckets configurados: product-images, category-images, payment-proofs' as buckets; 