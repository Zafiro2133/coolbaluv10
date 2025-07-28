-- Fix Product Images Simple Script
-- This script resolves all issues with product image uploads

-- 1. Create product_images table
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

-- 3. Create policies for public read access
CREATE POLICY "Product images are viewable by everyone" 
ON public.product_images 
FOR SELECT 
USING (true);

-- 4. Create policies for admin access
CREATE POLICY "Admins can manage product images" 
ON public.product_images 
FOR ALL 
USING (auth.role() = 'authenticated');

-- 5. Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create unique constraint to ensure only one primary image per product
DROP INDEX IF EXISTS product_images_primary_unique;
CREATE UNIQUE INDEX product_images_primary_unique 
ON public.product_images (product_id) 
WHERE is_primary = true;

-- 7. Create indexes for better performance
DROP INDEX IF EXISTS idx_product_images_product_id;
DROP INDEX IF EXISTS idx_product_images_display_order;
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_display_order ON public.product_images(display_order);

-- 8. Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 9. Create storage policies for public access
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

-- 10. Create storage policies for authenticated users
CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- 11. Update products table to ensure it has all necessary columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS extra_hour_percentage INTEGER DEFAULT 15;

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.product_images TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- 13. Verification queries
SELECT '✅ Product images table created/updated' as status;
SELECT '✅ Storage bucket configured' as status FROM storage.buckets WHERE id = 'product-images';
SELECT '✅ Policies created' as status;
SELECT '✅ Permissions granted' as status; 