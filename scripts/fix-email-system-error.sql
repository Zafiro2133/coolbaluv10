-- Script para solucionar el error de contact_messages
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear tabla contact_messages si no existe
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  mensaje TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view all contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update all contact messages" 
ON public.contact_messages 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete all contact messages" ON public.contact_messages;
CREATE POLICY "Admins can delete all contact messages" 
ON public.contact_messages 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- 5. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER trigger_update_contact_messages_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

-- 6. Verificar que se creó correctamente
SELECT '✅ Tabla contact_messages creada/verificada correctamente' as status; 