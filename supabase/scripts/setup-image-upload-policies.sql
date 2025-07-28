-- ============================================================================
-- CONFIGURACIÓN DE POLÍTICAS PARA CARGA DE IMÁGENES DE PRODUCTOS
-- ============================================================================
-- Este script configura las políticas necesarias para que los administradores
-- puedan cargar imágenes de productos en Supabase Storage.

-- ============================================================================
-- 1. VERIFICAR QUE EL BUCKET EXISTE
-- ============================================================================

-- Verificar si el bucket product-images existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE name = 'product-images'
    ) THEN
        RAISE EXCEPTION 'El bucket "product-images" no existe. Crea el bucket en Supabase Dashboard primero.';
    END IF;
END $$;

-- ============================================================================
-- 2. CONFIGURAR EL BUCKET COMO PÚBLICO
-- ============================================================================

-- Hacer el bucket público para lectura
UPDATE storage.buckets 
SET public = true 
WHERE name = 'product-images';

-- ============================================================================
-- 3. ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
-- ============================================================================

-- Eliminar políticas existentes para el bucket product-images
DELETE FROM storage.policies 
WHERE bucket_id = 'product-images';

-- ============================================================================
-- 4. CREAR POLÍTICAS NUEVAS
-- ============================================================================

-- Política para permitir subida de imágenes por usuarios autenticados
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = 'products'
    AND (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- Política para permitir actualización de imágenes por usuarios autenticados
CREATE POLICY "Allow authenticated users to update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = 'products'
);

-- Política para permitir eliminación de imágenes por usuarios autenticados
CREATE POLICY "Allow authenticated users to delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = 'products'
);

-- Política para permitir lectura pública de imágenes
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = 'products'
);

-- ============================================================================
-- 5. VERIFICAR CONFIGURACIÓN
-- ============================================================================

-- Mostrar configuración del bucket
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'product-images';

-- Mostrar políticas creadas
SELECT 
    name,
    operation,
    roles,
    definition
FROM storage.policies 
WHERE bucket_id = 'product-images'
ORDER BY operation;

-- ============================================================================
-- 6. FUNCIÓN DE UTILIDAD PARA LIMPIAR IMÁGENES HUÉRFANAS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_product_images()
RETURNS TABLE(deleted_files text[], deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphaned_files text[];
    file_record record;
    deleted_count bigint := 0;
BEGIN
    -- Encontrar archivos que no corresponden a productos existentes
    SELECT array_agg(s.name) INTO orphaned_files
    FROM storage.objects s
    WHERE s.bucket_id = 'product-images'
    AND (storage.foldername(s.name))[1] = 'products'
    AND (storage.foldername(s.name))[2] NOT IN (
        SELECT id::text FROM products
    );
    
    -- Eliminar archivos huérfanos
    IF orphaned_files IS NOT NULL THEN
        FOR file_record IN 
            SELECT name FROM storage.objects 
            WHERE bucket_id = 'product-images' 
            AND name = ANY(orphaned_files)
        LOOP
            DELETE FROM storage.objects 
            WHERE bucket_id = 'product-images' 
            AND name = file_record.name;
            deleted_count := deleted_count + 1;
        END LOOP;
    END IF;
    
    RETURN QUERY SELECT orphaned_files, deleted_count;
END;
$$;

-- ============================================================================
-- 7. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE IMÁGENES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_images_stats()
RETURNS TABLE(
    total_products bigint,
    products_with_images bigint,
    percentage_with_images numeric,
    total_images bigint,
    total_storage_size bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_products,
        COUNT(p.image_url) as products_with_images,
        ROUND(COUNT(p.image_url) * 100.0 / COUNT(*), 2) as percentage_with_images,
        COUNT(s.name) as total_images,
        COALESCE(SUM(s.metadata->>'size')::bigint, 0) as total_storage_size
    FROM products p
    LEFT JOIN storage.objects s ON 
        s.bucket_id = 'product-images' 
        AND (storage.foldername(s.name))[1] = 'products'
        AND (storage.foldername(s.name))[2] = p.id::text;
END;
$$;

-- ============================================================================
-- 8. EJECUTAR VERIFICACIONES FINALES
-- ============================================================================

-- Verificar que todo esté configurado correctamente
DO $$
DECLARE
    bucket_exists boolean;
    policies_count integer;
BEGIN
    -- Verificar bucket
    SELECT EXISTS(
        SELECT 1 FROM storage.buckets WHERE name = 'product-images'
    ) INTO bucket_exists;
    
    IF NOT bucket_exists THEN
        RAISE EXCEPTION '❌ El bucket product-images no existe';
    ELSE
        RAISE NOTICE '✅ Bucket product-images encontrado';
    END IF;
    
    -- Verificar políticas
    SELECT COUNT(*) FROM storage.policies 
    WHERE bucket_id = 'product-images' 
    INTO policies_count;
    
    IF policies_count < 4 THEN
        RAISE EXCEPTION '❌ Faltan políticas. Se encontraron % políticas, se esperaban 4', policies_count;
    ELSE
        RAISE NOTICE '✅ Políticas configuradas correctamente (% políticas)', policies_count;
    END IF;
    
    RAISE NOTICE '🎉 Configuración completada exitosamente!';
END $$;

-- ============================================================================
-- 9. MOSTRAR ESTADÍSTICAS INICIALES
-- ============================================================================

-- Mostrar estadísticas de productos e imágenes
SELECT * FROM get_product_images_stats();

-- Mostrar productos sin imágenes
SELECT 
    id,
    name,
    'Sin imagen' as status
FROM products 
WHERE image_url IS NULL OR image_url = ''
ORDER BY name;

-- Mostrar productos con imágenes
SELECT 
    p.id,
    p.name,
    p.image_url,
    CASE 
        WHEN s.name IS NOT NULL THEN 'Imagen existe'
        ELSE 'URL inválida'
    END as status
FROM products p
LEFT JOIN storage.objects s ON 
    s.bucket_id = 'product-images' 
    AND (storage.foldername(s.name))[1] = 'products'
    AND (storage.foldername(s.name))[2] = p.id::text
WHERE p.image_url IS NOT NULL AND p.image_url != ''
ORDER BY p.name; 