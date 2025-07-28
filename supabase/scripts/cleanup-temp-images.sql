-- Script para limpiar imágenes en la carpeta temp/ y corregir URLs
-- Este script identifica y corrige las URLs de imágenes que apuntan a la carpeta temp/

-- 1. Verificar productos con URLs que contienen 'temp/'
SELECT 
  id,
  name,
  image_url,
  'Producto con URL temp/' as issue
FROM products 
WHERE image_url LIKE '%temp/%'
ORDER BY created_at DESC;

-- 2. Verificar si hay archivos en la carpeta temp/ en el storage
-- (Esto se debe ejecutar desde la consola de Supabase Storage)

-- 3. Actualizar URLs de productos que contienen 'temp/' para usar un placeholder
-- IMPORTANTE: Solo ejecutar después de verificar que las imágenes se han movido
UPDATE products 
SET image_url = NULL
WHERE image_url LIKE '%temp/%';

-- 4. Verificar el resultado después de la limpieza
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'Sin imagen (limpiado)'
    WHEN image_url LIKE 'https://%' THEN 'URL completa'
    WHEN image_url LIKE 'product-images/%' THEN 'Ruta relativa correcta'
    ELSE 'Formato desconocido'
  END as status
FROM products 
ORDER BY created_at DESC
LIMIT 20;

-- 5. Para productos específicos que necesiten corrección manual:
-- UPDATE products 
-- SET image_url = 'product-images/NUEVO_ID_DEL_PRODUCTO/nombre-archivo.jpg'
-- WHERE id = 'ID_DEL_PRODUCTO';

-- 6. Verificar categorías con URLs problemáticas
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'Sin imagen'
    WHEN image_url LIKE '%temp/%' THEN 'URL temp/ (necesita corrección)'
    WHEN image_url LIKE 'https://%' THEN 'URL completa'
    WHEN image_url LIKE 'category-images/%' THEN 'Ruta relativa correcta'
    ELSE 'Formato desconocido'
  END as status
FROM categories 
WHERE image_url IS NOT NULL
ORDER BY created_at DESC; 