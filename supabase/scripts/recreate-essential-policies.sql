-- =====================================================
-- SCRIPT PARA RECREAR POLÍTICAS RLS ESENCIALES
-- Recrea las políticas necesarias de forma más simple
-- =====================================================

-- =====================================================
-- 1. POLÍTICAS PARA RESERVATIONS
-- =====================================================

-- Política para que usuarios vean sus propias reservas
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
CREATE POLICY "Users can view their own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que usuarios inserten sus propias reservas
DROP POLICY IF EXISTS "Users can insert their own reservations" ON public.reservations;
CREATE POLICY "Users can insert their own reservations" ON public.reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que usuarios actualicen sus propias reservas
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
CREATE POLICY "Users can update their own reservations" ON public.reservations
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que usuarios eliminen sus propias reservas
DROP POLICY IF EXISTS "Users can delete their own reservations" ON public.reservations;
CREATE POLICY "Users can delete their own reservations" ON public.reservations
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. POLÍTICAS PARA RESERVATION_ITEMS
-- =====================================================

-- Política para que usuarios vean items de sus reservas
DROP POLICY IF EXISTS "Users can view their reservation items" ON public.reservation_items;
CREATE POLICY "Users can view their reservation items" ON public.reservation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reservations r 
            WHERE r.id = reservation_id 
            AND r.user_id = auth.uid()
        )
    );

-- Política para que usuarios inserten items en sus reservas
DROP POLICY IF EXISTS "Users can insert their reservation items" ON public.reservation_items;
CREATE POLICY "Users can insert their reservation items" ON public.reservation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reservations r 
            WHERE r.id = reservation_id 
            AND r.user_id = auth.uid()
        )
    );

-- Política para que usuarios actualicen items de sus reservas
DROP POLICY IF EXISTS "Users can update their reservation items" ON public.reservation_items;
CREATE POLICY "Users can update their reservation items" ON public.reservation_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.reservations r 
            WHERE r.id = reservation_id 
            AND r.user_id = auth.uid()
        )
    );

-- Política para que usuarios eliminen items de sus reservas
DROP POLICY IF EXISTS "Users can delete their reservation items" ON public.reservation_items;
CREATE POLICY "Users can delete their reservation items" ON public.reservation_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.reservations r 
            WHERE r.id = reservation_id 
            AND r.user_id = auth.uid()
        )
    );

-- =====================================================
-- 3. POLÍTICAS PARA PROFILES
-- =====================================================

-- Política para que usuarios vean su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que usuarios inserten su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que usuarios actualicen su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. POLÍTICAS PARA CATEGORIES (PÚBLICAS)
-- =====================================================

-- Política para que todos vean categorías activas
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (is_active = true);

-- =====================================================
-- 5. POLÍTICAS PARA PRODUCTS (PÚBLICAS)
-- =====================================================

-- Política para que todos vean productos activos
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (is_active = true);

-- =====================================================
-- 6. POLÍTICAS PARA ZONES (PÚBLICAS)
-- =====================================================

-- Política para que todos vean zonas activas
DROP POLICY IF EXISTS "Zones are viewable by everyone" ON public.zones;
CREATE POLICY "Zones are viewable by everyone" ON public.zones
    FOR SELECT USING (is_active = true);

-- =====================================================
-- 7. POLÍTICAS PARA CONTACT_MESSAGES
-- =====================================================

-- Política para que usuarios autenticados inserten mensajes
DROP POLICY IF EXISTS "Authenticated users can insert contact messages" ON public.contact_messages;
CREATE POLICY "Authenticated users can insert contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para que usuarios vean sus propios mensajes
DROP POLICY IF EXISTS "Users can view their own contact messages" ON public.contact_messages;
CREATE POLICY "Users can view their own contact messages" ON public.contact_messages
    FOR SELECT USING (auth.uid()::text = email);

-- =====================================================
-- 8. VERIFICAR POLÍTICAS CREADAS
-- =====================================================

-- Mostrar todas las políticas creadas
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

-- =====================================================
-- RESUMEN DE POLÍTICAS CREADAS
-- =====================================================

/*
POLÍTICAS CREADAS:

RESERVATIONS:
- Users can view their own reservations
- Users can insert their own reservations  
- Users can update their own reservations
- Users can delete their own reservations

RESERVATION_ITEMS:
- Users can view their reservation items
- Users can insert their reservation items
- Users can update their reservation items
- Users can delete their reservation items

PROFILES:
- Users can view own profile
- Users can insert own profile
- Users can update own profile

CATEGORIES:
- Categories are viewable by everyone

PRODUCTS:
- Products are viewable by everyone

ZONES:
- Zones are viewable by everyone

CONTACT_MESSAGES:
- Authenticated users can insert contact messages
- Users can view their own contact messages

NOTA: Se eliminaron las políticas de admin que dependían de has_role()
      ya que la app no usa un sistema de roles complejo
*/ 