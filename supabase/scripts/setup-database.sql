-- =====================================================
-- SCRIPT PRINCIPAL: Configuración completa de la base de datos
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- ============================================================================
-- 1. CONFIGURACIÓN DE POLÍTICAS DE AVAILABILITIES
-- ============================================================================

-- Verificar que la función has_role existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'has_role' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE EXCEPTION 'La función has_role no existe. Asegúrate de que esté creada.';
    END IF;
END $$;

-- Verificar que la tabla availabilities existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'availabilities'
    ) THEN
        RAISE EXCEPTION 'La tabla availabilities no existe.';
    END IF;
END $$;

-- Eliminar políticas existentes de availabilities
DROP POLICY IF EXISTS "Availabilities are viewable by everyone" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can manage availabilities" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can insert availabilities" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can update availabilities" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can delete availabilities" ON public.availabilities;

-- Crear políticas mejoradas
-- Política 1: Todos pueden ver las disponibilidades
CREATE POLICY "Availabilities are viewable by everyone" 
ON public.availabilities 
FOR SELECT 
USING (true);

-- Política 2: Solo admins pueden insertar
CREATE POLICY "Admins can insert availabilities" 
ON public.availabilities 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política 3: Solo admins pueden actualizar
CREATE POLICY "Admins can update availabilities" 
ON public.availabilities 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política 4: Solo admins pueden eliminar
CREATE POLICY "Admins can delete availabilities" 
ON public.availabilities 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Verificar que RLS está habilitado
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CONFIGURACIÓN DE IMÁGENES DE PRODUCTOS
-- ============================================================================

-- Crear tabla product_images si no existe
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Crear políticas para product_images
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON public.product_images;
CREATE POLICY "Product images are viewable by everyone" 
ON public.product_images 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images" 
ON public.product_images 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Crear trigger para timestamps
DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índice único para imagen principal
DROP INDEX IF EXISTS product_images_primary_unique;
CREATE UNIQUE INDEX product_images_primary_unique 
ON public.product_images (product_id) 
WHERE is_primary = true;

-- Crear índices para rendimiento
DROP INDEX IF EXISTS idx_product_images_product_id;
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

DROP INDEX IF EXISTS idx_product_images_display_order;
CREATE INDEX idx_product_images_display_order ON public.product_images(display_order);

-- ============================================================================
-- 3. CONFIGURACIÓN DE ALMACENAMIENTO
-- ============================================================================

-- Crear bucket de almacenamiento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Crear políticas de almacenamiento
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- 4. FUNCIÓN DE LIMPIEZA DE DATOS
-- ============================================================================

-- Función para limpiar datos de manera segura
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(table_name text, deleted_count bigint) AS $$
DECLARE
    availabilities_deleted bigint := 0;
    contact_messages_deleted bigint := 0;
    reservations_deleted bigint := 0;
    users_deleted bigint := 0;
BEGIN
    -- Limpiar disponibilidades de fechas pasadas (más de 30 días)
    DELETE FROM public.availabilities 
    WHERE date < CURRENT_DATE - INTERVAL '30 days';
    GET DIAGNOSTICS availabilities_deleted = ROW_COUNT;
    
    -- Limpiar mensajes de contacto antiguos (más de 6 meses)
    DELETE FROM public.contact_messages 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
    GET DIAGNOSTICS contact_messages_deleted = ROW_COUNT;
    
    -- Limpiar reservaciones canceladas antiguas (más de 1 año)
    DELETE FROM public.reservations 
    WHERE status = 'cancelled' 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
    GET DIAGNOSTICS reservations_deleted = ROW_COUNT;
    
    -- Limpiar usuarios inactivos (más de 6 meses, excluyendo admins)
    DELETE FROM auth.users 
    WHERE last_sign_in_at < CURRENT_TIMESTAMP - INTERVAL '6 months'
    AND id NOT IN (
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
    );
    GET DIAGNOSTICS users_deleted = ROW_COUNT;
    
    -- Retornar resultados
    RETURN QUERY SELECT 'availabilities'::text, availabilities_deleted
    UNION ALL SELECT 'contact_messages'::text, contact_messages_deleted
    UNION ALL SELECT 'reservations'::text, reservations_deleted
    UNION ALL SELECT 'users'::text, users_deleted;
    
    RAISE NOTICE 'Limpieza completada: % disponibilidades, % mensajes, % reservaciones, % usuarios eliminados', 
        availabilities_deleted, contact_messages_deleted, reservations_deleted, users_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CONFIGURACIÓN ADICIONAL
-- ============================================================================

-- Asegurar que la tabla products tiene la columna extra_hour_percentage
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS extra_hour_percentage INTEGER DEFAULT 15;

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.product_images TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- ============================================================================
-- 6. VERIFICACIÓN FINAL
-- ============================================================================

-- Mostrar las políticas creadas para availabilities
SELECT 
    'availabilities' as table_name,
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        WHEN cmd = '*' THEN 'ALL'
        ELSE cmd::text
    END as operation,
    qual as condition
FROM pg_policies 
WHERE tablename = 'availabilities'
ORDER BY policyname;

-- Verificar configuración de almacenamiento
SELECT 
    'product-images' as bucket_name,
    public as is_public,
    file_size_limit as max_file_size,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'product-images';

-- Mostrar estadísticas actuales
SELECT 
    'availabilities' as table_name,
    COUNT(*) as current_records
FROM public.availabilities
UNION ALL
SELECT 
    'product_images' as table_name,
    COUNT(*) as current_records
FROM public.product_images
UNION ALL
SELECT 
    'products' as table_name,
    COUNT(*) as current_records
FROM public.products
ORDER BY table_name;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Configuración de base de datos completada exitosamente';
    RAISE NOTICE '✅ Políticas de seguridad aplicadas';
    RAISE NOTICE '✅ Sistema de imágenes configurado';
    RAISE NOTICE '✅ Almacenamiento configurado';
    RAISE NOTICE '✅ Función de limpieza creada';
END $$; 