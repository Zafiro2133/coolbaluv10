-- Script para asignar rol de customer a todos los usuarios existentes que no lo tengan
-- Este script debe ejecutarse manualmente en Supabase

-- Insertar rol de customer para usuarios que no lo tengan
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'customer'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'customer'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar que todos los usuarios tengan el rol de customer
SELECT 
  u.email,
  u.id,
  ur.role,
  CASE 
    WHEN ur.role IS NULL THEN 'SIN ROL'
    ELSE 'CON ROL'
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'customer'
ORDER BY u.created_at DESC; 