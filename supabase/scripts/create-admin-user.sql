-- Script para crear un usuario admin
-- Ejecutar manualmente en Supabase SQL Editor después de crear el usuario en Auth

-- Reemplazar 'tu-email@ejemplo.com' con el email del usuario que quieres hacer admin
-- Primero crear el usuario en Authentication > Users en el dashboard de Supabase

-- Insertar rol de admin para el usuario (reemplazar el UUID con el ID del usuario)
INSERT INTO public.user_roles (user_id, role)
VALUES (
    'TU_USER_ID_AQUI', -- Reemplazar con el UUID del usuario
    'admin'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = now();

-- Verificar que el usuario admin se creó correctamente
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.created_at,
    p.first_name,
    p.last_name,
    p.email
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN public.profiles p ON ur.user_id = p.user_id
WHERE ur.role = 'admin';

-- Para encontrar el UUID de un usuario por email:
-- SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com'; 