-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to view all user roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage user roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for all tables
-- Categories admin policies
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Products admin policies  
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Zones admin policies
CREATE POLICY "Admins can manage zones" 
ON public.zones 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Reservations admin policies
CREATE POLICY "Admins can view all reservations" 
ON public.reservations 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reservations" 
ON public.reservations 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Reservation items admin policies
CREATE POLICY "Admins can view all reservation items" 
ON public.reservation_items 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles admin policies
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Insert admin user (replace with actual email)
-- This creates the first admin user - you should change this email to your admin email
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@coolbalu.com.ar'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create storage policies for admin file uploads
CREATE POLICY "Admins can upload category images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'category-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update category images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'category-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete category images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'category-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Create bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Payment proofs storage policies
CREATE POLICY "Users can upload their payment proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-proofs' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view their own payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);