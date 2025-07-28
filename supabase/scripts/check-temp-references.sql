-- Script para verificar referencias a archivos temp/ en la base de datos
-- Basado en el archivo problemático: temp/1753709043689.png

-- 1. Verificar productos que referencien el archivo específico
SELECT 
  id,
  name,
  image_url,
  'Referencia directa al archivo problemático' as issue
FROM products 
WHERE image_url LIKE '%temp/1753709043689.png%'
ORDER BY created_at DESC;

-- 2. Verificar productos que referencien cualquier archivo en temp/
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN image_url LIKE '%temp/1753709043689.png%' THEN 'Archivo específico problemático'
    WHEN image_url LIKE '%temp/%' THEN 'Archivo en carpeta temp'
    ELSE 'Otro tipo de referencia'
  END as issue
FROM products 
WHERE image_url LIKE '%temp/%'
ORDER BY created_at DESC;

-- 3. Verificar categorías que referencien archivos en temp/
SELECT 
  id,
  name,
  image_url,
  'Categoría con archivo en temp/' as issue
FROM categories 
WHERE image_url LIKE '%temp/%'
ORDER BY created_at DESC;

-- 4. Contar cuántos productos tienen referencias a temp/
SELECT 
  COUNT(*) as total_products_with_temp_references,
  COUNT(CASE WHEN image_url LIKE '%temp/1753709043689.png%' THEN 1 END) as products_with_specific_file
FROM products 
WHERE image_url LIKE '%temp/%';

-- 5. Mostrar todos los archivos únicos referenciados en temp/
SELECT DISTINCT
  image_url,
  COUNT(*) as reference_count
FROM products 
WHERE image_url LIKE '%temp/%'
GROUP BY image_url
ORDER BY reference_count DESC;

-- 6. Para limpiar las referencias problemáticas (CUIDADO: esto elimina las referencias)
-- UPDATE products 
-- SET image_url = NULL
-- WHERE image_url LIKE '%temp/1753709043689.png%';

-- UPDATE products 
-- SET image_url = NULL
-- WHERE image_url LIKE '%temp/%';

-- 7. Verificar el estado después de la limpieza (ejecutar después del UPDATE)
-- SELECT 
--   id,
--   name,
--   image_url,
--   CASE 
--     WHEN image_url IS NULL THEN 'Sin imagen (limpiado)'
--     WHEN image_url LIKE '%temp/%' THEN 'Aún tiene referencia temp/'
--     ELSE 'Referencia válida'
--   END as status
-- FROM products 
-- ORDER BY created_at DESC
-- LIMIT 20; 