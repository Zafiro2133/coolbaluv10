-- Script para verificar y corregir la configuración del bucket de storage
-- Este script ayuda a diagnosticar problemas con tipos MIME en Supabase Storage

-- 1. Verificar la configuración actual del bucket product-images
-- (Esto se debe ejecutar desde la consola de Supabase Storage)

-- 2. Verificar que el bucket esté configurado correctamente
-- El bucket debe tener:
-- - id: 'product-images'
-- - public: true
-- - allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']

-- 3. Para verificar archivos en el storage con tipos MIME incorrectos:
-- SELECT 
--   name,
--   metadata->>'mimetype' as mime_type,
--   metadata->>'size' as file_size,
--   created_at
-- FROM storage.objects 
-- WHERE bucket_id = 'product-images'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- 4. Para actualizar tipos MIME de archivos existentes (si es necesario):
-- UPDATE storage.objects 
-- SET metadata = jsonb_set(metadata, '{mimetype}', '"image/png"')
-- WHERE bucket_id = 'product-images' 
--   AND name LIKE '%.png'
--   AND metadata->>'mimetype' != 'image/png';

-- UPDATE storage.objects 
-- SET metadata = jsonb_set(metadata, '{mimetype}', '"image/jpeg"')
-- WHERE bucket_id = 'product-images' 
--   AND name LIKE '%.jpg'
--   AND metadata->>'mimetype' != 'image/jpeg';

-- UPDATE storage.objects 
-- SET metadata = jsonb_set(metadata, '{mimetype}', '"image/jpeg"')
-- WHERE bucket_id = 'product-images' 
--   AND name LIKE '%.jpeg'
--   AND metadata->>'mimetype' != 'image/jpeg';

-- UPDATE storage.objects 
-- SET metadata = jsonb_set(metadata, '{mimetype}', '"image/webp"')
-- WHERE bucket_id = 'product-images' 
--   AND name LIKE '%.webp'
--   AND metadata->>'mimetype' != 'image/webp';

-- 5. Verificar archivos que podrían estar siendo interpretados como JSON:
-- SELECT 
--   name,
--   metadata->>'mimetype' as mime_type,
--   CASE 
--     WHEN metadata->>'mimetype' = 'application/json' THEN 'PROBLEMA: Archivo de imagen marcado como JSON'
--     WHEN metadata->>'mimetype' IS NULL THEN 'PROBLEMA: Sin tipo MIME'
--     WHEN metadata->>'mimetype' NOT LIKE 'image/%' THEN 'PROBLEMA: Tipo MIME incorrecto'
--     ELSE 'OK'
--   END as status
-- FROM storage.objects 
-- WHERE bucket_id = 'product-images'
--   AND (metadata->>'mimetype' = 'application/json' 
--        OR metadata->>'mimetype' IS NULL 
--        OR metadata->>'mimetype' NOT LIKE 'image/%')
-- ORDER BY created_at DESC;

-- 6. Para limpiar archivos problemáticos (CUIDADO: esto elimina archivos):
-- DELETE FROM storage.objects 
-- WHERE bucket_id = 'product-images' 
--   AND metadata->>'mimetype' = 'application/json';

-- 7. Verificar la configuración del bucket después de las correcciones:
-- SELECT 
--   id,
--   name,
--   public,
--   file_size_limit,
--   allowed_mime_types
-- FROM storage.buckets 
-- WHERE id = 'product-images'; 