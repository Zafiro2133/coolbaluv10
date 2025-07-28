-- Fix products RLS policies to allow admin operations
-- This migration fixes the 403 error when admins try to create/update/delete products

-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Create new policies that properly handle both public read access and admin full access

-- 1. Public read access - only active products
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- 2. Admin full access - admins can do everything (including inactive products)
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Admin read access - admins can see all products (active and inactive)
CREATE POLICY "Admins can view all products" 
ON public.products 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin insert access - admins can create new products
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Admin update access - admins can update any product
CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Admin delete access - admins can delete any product
CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Verify the policies are working
-- This will show the current policies on the products table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname; 