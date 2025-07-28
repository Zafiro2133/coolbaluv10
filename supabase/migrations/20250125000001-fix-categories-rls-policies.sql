-- Fix categories RLS policies to allow admin operations
-- This migration ensures admins can manage categories properly

-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- Create new policies that properly handle both public read access and admin full access

-- 1. Public read access - only active categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

-- 2. Admin full access - admins can do everything (including inactive categories)
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Admin read access - admins can see all categories (active and inactive)
CREATE POLICY "Admins can view all categories" 
ON public.categories 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin insert access - admins can create new categories
CREATE POLICY "Admins can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Admin update access - admins can update any category
CREATE POLICY "Admins can update categories" 
ON public.categories 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Admin delete access - admins can delete any category
CREATE POLICY "Admins can delete categories" 
ON public.categories 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Verify the policies are working
-- This will show the current policies on the categories table
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
WHERE tablename = 'categories' 
ORDER BY policyname; 