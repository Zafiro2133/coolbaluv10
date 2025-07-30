-- Migración para agregar políticas RLS a la tabla user_roles
-- Fecha: 2025-01-28

-- Habilitar RLS en la tabla user_roles si no está habilitado
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver su propio rol
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Política para que los admins puedan ver todos los roles
CREATE POLICY "Admins can view all user roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para que los admins puedan insertar roles
CREATE POLICY "Admins can insert user roles" ON public.user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para que los admins puedan actualizar roles
CREATE POLICY "Admins can update user roles" ON public.user_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para que los admins puedan eliminar roles
CREATE POLICY "Admins can delete user roles" ON public.user_roles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    ); 