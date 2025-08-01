-- =====================================================
-- CORRECCIÓN DE POLÍTICAS RLS Y HABILITACIÓN DE SEGURIDAD
-- Fecha: 2025-01-31
-- Propósito: Corregir inconsistencias y habilitar RLS en todas las tablas
-- =====================================================

-- 1. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
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

-- 2. CORREGIR POLÍTICAS INCONSISTENTES PARA RESERVATIONS
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Admins can view all reservations" ON public.reservations
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all reservations" ON public.reservations;
CREATE POLICY "Admins can update all reservations" ON public.reservations
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 3. CORREGIR POLÍTICAS INCONSISTENTES PARA RESERVATION_ITEMS
DROP POLICY IF EXISTS "Admins can view all reservation items" ON public.reservation_items;
CREATE POLICY "Admins can view all reservation items" ON public.reservation_items
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert all reservation items" ON public.reservation_items;
CREATE POLICY "Admins can insert all reservation items" ON public.reservation_items
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. VERIFICAR QUE LAS FUNCIONES DE ROLES FUNCIONEN CORRECTAMENTE
-- Verificar que la función has_role esté funcionando
SELECT public.has_role(auth.uid(), 'admin') as is_admin;

-- 5. VERIFICAR QUE LOS USUARIOS TENGAN ROLES ASIGNADOS
-- Verificar usuarios sin roles asignados
SELECT 
    u.id,
    u.email,
    CASE WHEN ur.role IS NULL THEN 'SIN ROL' ELSE ur.role::text END as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- 6. ASIGNAR ROL DE CUSTOMER A USUARIOS SIN ROL
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'customer'
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. VERIFICAR ESTADO FINAL
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'user_roles', 'categories', 'products', 
    'availabilities', 'contact_messages', 'system_settings',
    'cart_items', 'reservations', 'reservation_items',
    'audit_log', 'email_logs', 'email_templates', 'email_config'
)
ORDER BY tablename; 