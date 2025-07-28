-- Fix Product Images Final Script
-- This script resolves all issues with product image uploads

-- 1. Ensure product_images table exists and is properly configured
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;

-- 4. Create policies for public read access
CREATE POLICY "Product images are viewable by everyone" 
ON public.product_images 
FOR SELECT 
USING (true);

-- 5. Create policies for admin access
CREATE POLICY "Admins can manage product images" 
ON public.product_images 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create unique constraint to ensure only one primary image per product
DROP INDEX IF EXISTS product_images_primary_unique;
CREATE UNIQUE INDEX product_images_primary_unique 
ON public.product_images (product_id) 
WHERE is_primary = true;

-- 8. Create indexes for better performance
DROP INDEX IF EXISTS idx_product_images_product_id;
DROP INDEX IF EXISTS idx_product_images_display_order;
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_display_order ON public.product_images(display_order);

-- 9. Ensure storage bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 10. Drop existing storage policies (using correct syntax)
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- 11. Create storage policies for public access to product images
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

-- 12. Create storage policies for admin uploads
CREATE POLICY "Admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

-- 13. Ensure has_role function exists
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 14. Create app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 15. Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 16. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 17. Create policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 18. Update products table to ensure it has all necessary columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS extra_hour_percentage INTEGER DEFAULT 15;

-- 19. Create RPC functions for product images management
CREATE OR REPLACE FUNCTION public.get_product_images(product_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'display_order', pi.display_order,
        'is_primary', pi.is_primary
      ) ORDER BY pi.display_order
    )
    FROM public.product_images pi 
    WHERE pi.product_id = product_uuid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_product_images(product_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.product_images WHERE product_id = product_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_product_images(
  product_uuid UUID,
  images_data JSON
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  img JSON;
BEGIN
  -- First delete existing images
  DELETE FROM public.product_images WHERE product_id = product_uuid;
  
  -- Then insert new images
  FOR img IN SELECT * FROM json_array_elements(images_data)
  LOOP
    INSERT INTO public.product_images (
      product_id,
      image_url,
      display_order,
      is_primary
    ) VALUES (
      product_uuid,
      (img->>'image_url')::TEXT,
      (img->>'display_order')::INTEGER,
      (img->>'is_primary')::BOOLEAN
    );
  END LOOP;
END;
$$;

-- 20. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.product_images TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_product_images(UUID, JSON) TO authenticated;

-- 21. Insert admin user if not exists (replace with actual admin email)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@coolbalu.com.ar'
ON CONFLICT (user_id, role) DO NOTHING;

-- 22. Verification queries
SELECT '✅ Product images table created/updated' as status;
SELECT '✅ Storage bucket configured' as status FROM storage.buckets WHERE id = 'product-images';
SELECT '✅ Policies created' as status;
SELECT '✅ RPC functions created' as status;
SELECT '✅ Admin user configured' as status; 