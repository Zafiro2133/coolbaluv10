-- Script para verificar y corregir las URLs de las imágenes de productos
-- Basado en la URL correcta proporcionada: https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/torre-magica1.png

-- 1. Verificar las URLs actuales de las imágenes de productos
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'Sin imagen'
    WHEN image_url LIKE 'https://%' THEN 'URL completa'
    WHEN image_url LIKE 'product-images/%' THEN 'Ruta relativa con bucket'
    ELSE 'Formato desconocido'
  END as url_type
FROM products 
WHERE image_url IS NOT NULL
ORDER BY created_at DESC;

-- 2. Verificar las URLs de las imágenes de categorías
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'Sin imagen'
    WHEN image_url LIKE 'https://%' THEN 'URL completa'
    WHEN image_url LIKE 'category-images/%' THEN 'Ruta relativa con bucket'
    ELSE 'Formato desconocido'
  END as url_type
FROM categories 
WHERE image_url IS NOT NULL
ORDER BY created_at DESC;

-- 3. Mostrar ejemplos de URLs que necesitan corrección
SELECT 
  id,
  name,
  image_url,
  'URL actual' as status
FROM products 
WHERE image_url IS NOT NULL 
  AND image_url NOT LIKE 'https://%'
  AND image_url NOT LIKE 'product-images/%'
LIMIT 10;

-- 4. Si necesitas corregir URLs específicas, puedes usar este formato:
-- UPDATE products 
-- SET image_url = 'product-images/' || image_url
-- WHERE image_url IS NOT NULL 
--   AND image_url NOT LIKE 'https://%'
--   AND image_url NOT LIKE 'product-images/%';

-- 5. Para verificar que las URLs sean accesibles, puedes probar con:
-- SELECT 
--   id,
--   name,
--   image_url,
--   'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/' || image_url as full_url
-- FROM products 
-- WHERE image_url IS NOT NULL 
--   AND image_url LIKE 'product-images/%'
-- LIMIT 5; 