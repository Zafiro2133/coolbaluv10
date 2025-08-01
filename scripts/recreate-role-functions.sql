-- =====================================================
-- RECREAR FUNCIONES DE ROLES
-- Fecha: 2025-01-31
-- Propósito: Recrear las funciones necesarias para el sistema de roles
-- =====================================================

-- 1. FUNCIÓN PARA VERIFICAR SI UN USUARIO TIENE UN ROL ESPECÍFICO
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = _role
  );
END;
$$;

-- 2. FUNCIÓN PARA OBTENER EL ROL DEL USUARIO ACTUAL
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'customer');
END;
$$;

-- 3. FUNCIÓN PARA MANEJAR NUEVOS USUARIOS (TRIGGER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear perfil automáticamente
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Asignar rol de customer por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. VERIFICAR QUE LAS FUNCIONES SE CREARON CORRECTAMENTE
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('has_role', 'get_current_user_role', 'handle_new_user')
ORDER BY routine_name;

-- 5. PROBAR LA FUNCIÓN has_role
SELECT 
    'Función has_role creada correctamente' as status,
    public.has_role(auth.uid(), 'customer') as is_customer,
    public.has_role(auth.uid(), 'admin') as is_admin;

-- 6. PROBAR LA FUNCIÓN get_current_user_role
SELECT 
    'Función get_current_user_role creada correctamente' as status,
    public.get_current_user_role() as current_role; 