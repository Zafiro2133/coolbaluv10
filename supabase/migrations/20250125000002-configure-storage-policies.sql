-- ============================================================================
-- CONFIGURACIÓN DE POLÍTICAS DE STORAGE PARA SUBIDA DE IMÁGENES
-- ============================================================================
-- Esta migración configura las políticas necesarias para el nuevo sistema
-- de subida de imágenes usando Supabase Storage JS Client

-- ============================================================================
-- BUCKET: product-images
-- ============================================================================

-- Política para lectura pública de imágenes de productos
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

-- Política para subida de imágenes de productos por usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- Política para actualización de imágenes de productos por usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- Política para eliminación de imágenes de productos por usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- ============================================================================
-- BUCKET: category-images
-- ============================================================================

-- Política para lectura pública de imágenes de categorías
DROP POLICY IF EXISTS "Category images are publicly accessible" ON storage.objects;
CREATE POLICY "Category images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-images');

-- Política para subida de imágenes de categorías por usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can upload category images" ON storage.objects;
CREATE POLICY "Authenticated users can upload category images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'category-images' AND 
  auth.role() = 'authenticated'
);

-- Política para actualización de imágenes de categorías por usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can update category images" ON storage.objects;
CREATE POLICY "Authenticated users can update category images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'category-images' AND 
  auth.role() = 'authenticated'
);

-- Política para eliminación de imágenes de categorías por usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can delete category images" ON storage.objects;
CREATE POLICY "Authenticated users can delete category images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'category-images' AND 
  auth.role() = 'authenticated'
);

-- ============================================================================
-- BUCKET: payment-proofs
-- ============================================================================

-- Política para lectura de comprobantes de pago por el propietario
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
CREATE POLICY "Users can view their own payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para subida de comprobantes de pago por el propietario
DROP POLICY IF EXISTS "Users can upload their payment proofs" ON storage.objects;
CREATE POLICY "Users can upload their payment proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para actualización de comprobantes de pago por el propietario
DROP POLICY IF EXISTS "Users can update their payment proofs" ON storage.objects;
CREATE POLICY "Users can update their payment proofs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para eliminación de comprobantes de pago por el propietario
DROP POLICY IF EXISTS "Users can delete their payment proofs" ON storage.objects;
CREATE POLICY "Users can delete their payment proofs" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para que los administradores puedan ver todos los comprobantes
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
CREATE POLICY "Admins can view all payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-proofs' AND 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- VERIFICACIÓN DE BUCKETS
-- ============================================================================

-- Verificar que los buckets existen, si no, crearlos
DO $$
BEGIN
  -- Crear bucket product-images si no existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  END IF;

  -- Crear bucket category-images si no existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'category-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  END IF;

  -- Crear bucket payment-proofs si no existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);
  END IF;
END $$;

-- ============================================================================
-- FUNCIÓN DE UTILIDAD PARA LIMPIAR ARCHIVOS TEMPORALES
-- ============================================================================

-- Función para limpiar archivos temporales antiguos (más de 24 horas)
CREATE OR REPLACE FUNCTION public.cleanup_temp_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar archivos temporales de product-images
  DELETE FROM storage.objects 
  WHERE bucket_id = 'product-images' 
    AND name LIKE 'temp/%'
    AND created_at < now() - interval '24 hours';
    
  -- Eliminar archivos temporales de category-images
  DELETE FROM storage.objects 
  WHERE bucket_id = 'category-images' 
    AND name LIKE 'temp/%'
    AND created_at < now() - interval '24 hours';
    
  -- Eliminar archivos temporales de payment-proofs
  DELETE FROM storage.objects 
  WHERE bucket_id = 'payment-proofs' 
    AND name LIKE 'temp/%'
    AND created_at < now() - interval '24 hours';
END;
$$;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON FUNCTION public.cleanup_temp_files() IS 'Limpia archivos temporales antiguos de todos los buckets de storage';

-- Agregar comentarios a las políticas para documentación
COMMENT ON POLICY "Product images are publicly accessible" ON storage.objects IS 'Permite lectura pública de imágenes de productos';
COMMENT ON POLICY "Authenticated users can upload product images" ON storage.objects IS 'Permite a usuarios autenticados subir imágenes de productos';
COMMENT ON POLICY "Category images are publicly accessible" ON storage.objects IS 'Permite lectura pública de imágenes de categorías';
COMMENT ON POLICY "Authenticated users can upload category images" ON storage.objects IS 'Permite a usuarios autenticados subir imágenes de categorías';
COMMENT ON POLICY "Users can view their own payment proofs" ON storage.objects IS 'Permite a usuarios ver sus propios comprobantes de pago';
COMMENT ON POLICY "Users can upload their payment proofs" ON storage.objects IS 'Permite a usuarios subir sus propios comprobantes de pago';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Mostrar resumen de la configuración
SELECT 
  'Storage Configuration Complete' as status,
  'All buckets and policies have been configured for the new image upload system' as message; 