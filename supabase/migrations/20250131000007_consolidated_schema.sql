-- =====================================================
-- MIGRACIÓN CONSOLIDADA: Estado actual de la base de datos
-- Fecha: 2025-01-31
-- Propósito: Consolidar todas las migraciones en un solo archivo
-- que represente el estado actual de la base de datos
-- =====================================================

-- 1. CREAR TIPOS Y ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- 2. CREAR TABLAS PRINCIPALES

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de roles de usuario
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  extra_hour_percentage INTEGER DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de disponibilidades
CREATE TABLE IF NOT EXISTS public.availabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  hour TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, hour)
);

-- Tabla de mensajes de contacto
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

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de carrito de compras
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  extra_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  adult_count INTEGER NOT NULL DEFAULT 1,
  child_count INTEGER NOT NULL DEFAULT 0,
  comments TEXT,
  rain_reschedule TEXT DEFAULT 'no' CHECK (rain_reschedule IN ('no', 'indoor', 'reschedule')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de items de reserva
CREATE TABLE IF NOT EXISTS public.reservation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  extra_hours INTEGER NOT NULL DEFAULT 0,
  extra_hour_percentage INTEGER NOT NULL DEFAULT 0,
  item_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- Tabla de logs de email
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('reservation_confirmation', 'reservation_update', 'contact_form', 'admin_notification', 'payment_confirmation')),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    related_reservation_id UUID,
    related_contact_message_id UUID,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de plantillas de email
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de email
CREATE TABLE IF NOT EXISTS public.email_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_availabilities_date_hour ON public.availabilities(date, hour);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON public.system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON public.reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON public.reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_reservation ON public.email_logs(related_reservation_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_config_key ON public.email_config(config_key);

-- 4. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
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

-- 5. CREAR FUNCIONES PRINCIPALES

-- Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar roles de usuario
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

-- Función para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Función para calcular total de item con horas extra
CREATE OR REPLACE FUNCTION calculate_item_total_with_extra_hours(
    base_price DECIMAL(10,2),
    quantity INTEGER,
    extra_hours INTEGER,
    extra_hour_percentage DECIMAL(5,2)
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    extra_cost DECIMAL(10,2);
    total DECIMAL(10,2);
BEGIN
    -- Calcular costo de horas extra
    extra_cost := (base_price * extra_hour_percentage / 100) * extra_hours;
    
    -- Calcular total: (precio base + costo horas extra) * cantidad
    total := (base_price + extra_cost) * quantity;
    
    RETURN ROUND(total, 2);
END;
$$;

-- Función para calcular subtotal de reserva
CREATE OR REPLACE FUNCTION calculate_reservation_subtotal(reservation_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    subtotal DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(item_total), 0)
    INTO subtotal
    FROM public.reservation_items
    WHERE reservation_id = reservation_uuid;
    
    RETURN subtotal;
END;
$$;

-- Función para calcular total de reserva
CREATE OR REPLACE FUNCTION calculate_reservation_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total = NEW.subtotal + COALESCE(NEW.transport_cost, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para validar que el usuario existe
CREATE OR REPLACE FUNCTION validate_user_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para registrar cambios en audit_log
CREATE OR REPLACE FUNCTION log_reservation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Solo registrar si hay cambios reales
    IF TG_OP = 'UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO public.audit_log (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Función para calcular item_total automáticamente
CREATE OR REPLACE FUNCTION calculate_item_total_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Solo calcular si item_total es NULL o 0
    IF NEW.item_total IS NULL OR NEW.item_total = 0 THEN
        NEW.item_total := calculate_item_total_with_extra_hours(
            NEW.product_price,
            NEW.quantity,
            NEW.extra_hours,
            NEW.extra_hour_percentage
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Función para actualizar subtotal de reserva
CREATE OR REPLACE FUNCTION update_reservation_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Actualizar subtotal de la reserva
    UPDATE public.reservations 
    SET subtotal = calculate_reservation_subtotal(NEW.reservation_id)
    WHERE id = NEW.reservation_id;
    
    RETURN NEW;
END;
$$;

-- Función para actualizar timestamps de system_settings
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar timestamps de email_templates
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar timestamps de email_config
CREATE OR REPLACE FUNCTION update_email_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funciones helper para sistema de emails
CREATE OR REPLACE FUNCTION get_email_config(config_key_param VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    config_value TEXT;
BEGIN
    SELECT config_value INTO config_value
    FROM public.email_config
    WHERE config_key = config_key_param;
    
    RETURN config_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_email_template(template_key_param VARCHAR(100))
RETURNS TABLE (
    subject VARCHAR(500),
    html_content TEXT,
    text_content TEXT,
    variables JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.subject,
        et.html_content,
        et.text_content,
        et.variables
    FROM public.email_templates et
    WHERE et.template_key = template_key_param
    AND et.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_email_sent(
    email_type_param VARCHAR(50),
    recipient_email_param VARCHAR(255),
    recipient_name_param VARCHAR(255),
    subject_param VARCHAR(500),
    content_param TEXT,
    metadata_param JSONB DEFAULT '{}',
    related_reservation_id_param UUID DEFAULT NULL,
    related_contact_message_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    email_log_id UUID;
BEGIN
    INSERT INTO public.email_logs (
        email_type,
        recipient_email,
        recipient_name,
        subject,
        content,
        metadata,
        related_reservation_id,
        related_contact_message_id
    ) VALUES (
        email_type_param,
        recipient_email_param,
        recipient_name_param,
        subject_param,
        content_param,
        metadata_param,
        related_reservation_id_param,
        related_contact_message_id_param
    ) RETURNING id INTO email_log_id;
    
    RETURN email_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funciones helper para system_settings
CREATE OR REPLACE FUNCTION get_system_setting(setting_key_param VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT setting_value INTO setting_value
    FROM public.system_settings
    WHERE setting_key = setting_key_param;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_system_setting(
    setting_key_param VARCHAR(100),
    setting_value_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.system_settings
    SET setting_value = setting_value_param,
        updated_at = NOW()
    WHERE setting_key = setting_key_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREAR TRIGGERS

-- Triggers para actualizar timestamps automáticamente
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trigger_update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

DROP TRIGGER IF EXISTS trigger_update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER trigger_update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

DROP TRIGGER IF EXISTS trigger_update_email_config_updated_at ON public.email_config;
CREATE TRIGGER trigger_update_email_config_updated_at
  BEFORE UPDATE ON public.email_config
  FOR EACH ROW
  EXECUTE FUNCTION update_email_config_updated_at();

-- Trigger para crear perfil automáticamente al registrarse
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers para calcular totales automáticamente
DROP TRIGGER IF EXISTS calculate_reservation_total_trigger ON public.reservations;
CREATE TRIGGER calculate_reservation_total_trigger
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reservation_total();

DROP TRIGGER IF EXISTS validate_reservation_user ON public.reservations;
CREATE TRIGGER validate_reservation_user
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_exists();

-- Triggers para reservation_items
DROP TRIGGER IF EXISTS calculate_item_total_trigger ON public.reservation_items;
CREATE TRIGGER calculate_item_total_trigger
  BEFORE INSERT OR UPDATE ON public.reservation_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_item_total_trigger();

DROP TRIGGER IF EXISTS update_reservation_subtotal_trigger ON public.reservation_items;
CREATE TRIGGER update_reservation_subtotal_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reservation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_subtotal();

-- Triggers para auditoría
DROP TRIGGER IF EXISTS audit_reservations_trigger ON public.reservations;
CREATE TRIGGER audit_reservations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION log_reservation_change();

DROP TRIGGER IF EXISTS audit_reservation_items_trigger ON public.reservation_items;
CREATE TRIGGER audit_reservation_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reservation_items
  FOR EACH ROW
  EXECUTE FUNCTION log_reservation_change();

-- 7. CREAR POLÍTICAS RLS (ROW LEVEL SECURITY)

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para availabilities
DROP POLICY IF EXISTS "Availabilities are viewable by everyone" ON public.availabilities;
CREATE POLICY "Availabilities are viewable by everyone" 
ON public.availabilities 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage availabilities" ON public.availabilities;
CREATE POLICY "Admins can manage availabilities" 
ON public.availabilities 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para contact_messages
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

-- Políticas para system_settings
DROP POLICY IF EXISTS "admin_full_access_system_settings" ON public.system_settings;
CREATE POLICY "admin_full_access_system_settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "authenticated_read_public_settings" ON public.system_settings;
CREATE POLICY "authenticated_read_public_settings" ON public.system_settings
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_public = true
    );

-- Políticas para cart_items
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
CREATE POLICY "Users can insert their own cart items" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
CREATE POLICY "Users can update their own cart items" 
ON public.cart_items 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
CREATE POLICY "Users can view their own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reservations" ON public.reservations;
CREATE POLICY "Users can insert their own reservations" ON public.reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
CREATE POLICY "Users can update their own reservations" ON public.reservations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Admins can view all reservations" ON public.reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all reservations" ON public.reservations;
CREATE POLICY "Admins can update all reservations" ON public.reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas para reservation_items
DROP POLICY IF EXISTS "Users can view their own reservation items" ON public.reservation_items;
CREATE POLICY "Users can view their own reservation items" ON public.reservation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reservations 
            WHERE reservations.id = reservation_items.reservation_id 
            AND reservations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert reservation items" ON public.reservation_items;
CREATE POLICY "Users can insert reservation items" ON public.reservation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reservations 
            WHERE reservations.id = reservation_items.reservation_id 
            AND reservations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all reservation items" ON public.reservation_items;
CREATE POLICY "Admins can view all reservation items" ON public.reservation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert all reservation items" ON public.reservation_items;
CREATE POLICY "Admins can insert all reservation items" ON public.reservation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas para audit_log
DROP POLICY IF EXISTS "Admins can view audit_log" ON public.audit_log;
CREATE POLICY "Admins can view audit_log" ON public.audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para email_logs
DROP POLICY IF EXISTS "admins_can_view_all_email_logs" ON public.email_logs;
CREATE POLICY "admins_can_view_all_email_logs" ON public.email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "admins_can_insert_email_logs" ON public.email_logs;
CREATE POLICY "admins_can_insert_email_logs" ON public.email_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "admins_can_update_email_logs" ON public.email_logs;
CREATE POLICY "admins_can_update_email_logs" ON public.email_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Políticas para email_templates
DROP POLICY IF EXISTS "admins_full_access_email_templates" ON public.email_templates;
CREATE POLICY "admins_full_access_email_templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Políticas para email_config
DROP POLICY IF EXISTS "admins_full_access_email_config" ON public.email_config;
CREATE POLICY "admins_full_access_email_config" ON public.email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    ); 