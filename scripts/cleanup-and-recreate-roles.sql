-- =====================================================
-- LIMPIEZA COMPLETA Y RECREACIÓN DE ROLES
-- Fecha: 2025-01-31
-- Propósito: Eliminar todos los roles existentes y recrear solo los necesarios
-- =====================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS RLS EXISTENTES
-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- User roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- Products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Availabilities
DROP POLICY IF EXISTS "Availabilities are viewable by everyone" ON public.availabilities;
DROP POLICY IF EXISTS "Admins can manage availabilities" ON public.availabilities;

-- Contact messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete all contact messages" ON public.contact_messages;

-- System settings
DROP POLICY IF EXISTS "admin_full_access_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_read_public_settings" ON public.system_settings;

-- Cart items
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

-- Reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON public.reservations;

-- Reservation items
DROP POLICY IF EXISTS "Users can view their own reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Users can insert reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can view all reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Admins can insert all reservation items" ON public.reservation_items;

-- Audit log
DROP POLICY IF EXISTS "Admins can view audit_log" ON public.audit_log;

-- Email logs
DROP POLICY IF EXISTS "admins_can_view_all_email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "admins_can_insert_email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "admins_can_update_email_logs" ON public.email_logs;

-- Email templates
DROP POLICY IF EXISTS "admins_full_access_email_templates" ON public.email_templates;

-- Email config
DROP POLICY IF EXISTS "admins_full_access_email_config" ON public.email_config;

-- 2. ELIMINAR TODOS LOS ROLES DE USUARIO EXISTENTES
DELETE FROM public.user_roles;

-- 3. RECREAR EL ENUM DE ROLES (por si acaso)
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- 4. RECREAR LA TABLA USER_ROLES CON ESTRUCTURA LIMPIA
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 5. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;

-- 6. RECREAR TODAS LAS POLÍTICAS RLS DE MANERA CONSISTENTE

-- ===== POLÍTICAS PARA PROFILES =====
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA USER_ROLES =====
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles" 
ON public.user_roles FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA CATEGORIES =====
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA PRODUCTS =====
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA AVAILABILITIES =====
CREATE POLICY "Availabilities are viewable by everyone" 
ON public.availabilities FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage availabilities" 
ON public.availabilities FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA CONTACT_MESSAGES =====
CREATE POLICY "Anyone can insert contact messages" 
ON public.contact_messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages" 
ON public.contact_messages FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all contact messages" 
ON public.contact_messages FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all contact messages" 
ON public.contact_messages FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA SYSTEM_SETTINGS =====
CREATE POLICY "Admins full access system settings" 
ON public.system_settings FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read public settings" 
ON public.system_settings FOR SELECT 
USING (auth.role() = 'authenticated' AND is_public = true);

-- ===== POLÍTICAS PARA CART_ITEMS =====
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" 
ON public.cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" 
ON public.cart_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items FOR DELETE 
USING (auth.uid() = user_id);

-- ===== POLÍTICAS PARA RESERVATIONS =====
CREATE POLICY "Users can view their own reservations" 
ON public.reservations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations" 
ON public.reservations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" 
ON public.reservations FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reservations" 
ON public.reservations FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA RESERVATION_ITEMS =====
CREATE POLICY "Users can view their own reservation items" 
ON public.reservation_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.reservations 
        WHERE reservations.id = reservation_items.reservation_id 
        AND reservations.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert reservation items" 
ON public.reservation_items FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.reservations 
        WHERE reservations.id = reservation_items.reservation_id 
        AND reservations.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all reservation items" 
ON public.reservation_items FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all reservation items" 
ON public.reservation_items FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA AUDIT_LOG =====
CREATE POLICY "Admins can view audit_log" 
ON public.audit_log FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA EMAIL_LOGS =====
CREATE POLICY "Admins can view all email logs" 
ON public.email_logs FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email logs" 
ON public.email_logs FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email logs" 
ON public.email_logs FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA EMAIL_TEMPLATES =====
CREATE POLICY "Admins full access email templates" 
ON public.email_templates FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS PARA EMAIL_CONFIG =====
CREATE POLICY "Admins full access email config" 
ON public.email_config FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 7. ASIGNAR ROL DE CUSTOMER A TODOS LOS USUARIOS EXISTENTES
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'customer'
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. VERIFICAR ESTADO FINAL
SELECT 'Roles recreados exitosamente' as status;

-- Verificar usuarios y sus roles
SELECT 
    u.email,
    ur.role,
    u.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- Verificar políticas creadas
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 