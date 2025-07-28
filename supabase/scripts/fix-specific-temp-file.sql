-- Script específico para corregir el archivo problemático mostrado en la imagen
-- Archivo: temp/1753709043689.png que está marcado como application/json

-- 1. Verificar el archivo específico
SELECT 
  name,
  metadata->>'mimetype' as mime_type,
  metadata->>'size' as file_size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name = 'temp/1753709043689.png';

-- 2. Corregir el tipo MIME del archivo específico
UPDATE storage.objects 
SET metadata = jsonb_set(metadata, '{mimetype}', '"image/png"')
WHERE bucket_id = 'product-images' 
  AND name = 'temp/1753709043689.png'
  AND metadata->>'mimetype' = 'application/json';

-- 3. Verificar que se corrigió correctamente
SELECT 
  name,
  metadata->>'mimetype' as mime_type,
  metadata->>'size' as file_size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name = 'temp/1753709043689.png';

-- 4. Buscar otros archivos PNG en la carpeta temp que tengan el mismo problema
SELECT 
  name,
  metadata->>'mimetype' as mime_type,
  metadata->>'size' as file_size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'temp/%.png'
  AND metadata->>'mimetype' = 'application/json'
ORDER BY created_at DESC;

-- 5. Corregir todos los archivos PNG en temp que estén marcados como JSON
UPDATE storage.objects 
SET metadata = jsonb_set(metadata, '{mimetype}', '"image/png"')
WHERE bucket_id = 'product-images' 
  AND name LIKE 'temp/%.png'
  AND metadata->>'mimetype' = 'application/json';

-- 6. Buscar archivos JPG/JPEG en temp con el mismo problema
SELECT 
  name,
  metadata->>'mimetype' as mime_type,
  metadata->>'size' as file_size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'temp/%.jpg'
  AND metadata->>'mimetype' = 'application/json'
ORDER BY created_at DESC;

-- 7. Corregir archivos JPG en temp
UPDATE storage.objects 
SET metadata = jsonb_set(metadata, '{mimetype}', '"image/jpeg"')
WHERE bucket_id = 'product-images' 
  AND name LIKE 'temp/%.jpg'
  AND metadata->>'mimetype' = 'application/json';

-- 8. Verificar el estado final de la carpeta temp
SELECT 
  name,
  metadata->>'mimetype' as mime_type,
  metadata->>'size' as file_size,
  created_at,
  CASE 
    WHEN metadata->>'mimetype' = 'application/json' THEN 'PROBLEMA: Marcado como JSON'
    WHEN metadata->>'mimetype' IS NULL THEN 'PROBLEMA: Sin tipo MIME'
    WHEN metadata->>'mimetype' NOT LIKE 'image/%' THEN 'PROBLEMA: Tipo MIME incorrecto'
    ELSE 'OK'
  END as status
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'temp/%'
ORDER BY created_at DESC; 