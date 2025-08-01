-- Script completo para configurar el sistema de emails
-- Ejecutar este script en Supabase SQL Editor

-- ========================================
-- 1. CREAR TABLA CONTACT_MESSAGES
-- ========================================

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

-- Habilitar RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- Trigger para updated_at
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

-- ========================================
-- 2. CREAR TABLAS DEL SISTEMA DE EMAILS
-- ========================================

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

-- ========================================
-- 3. CREAR ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_reservation ON public.email_logs(related_reservation_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_config_key ON public.email_config(config_key);

-- ========================================
-- 4. INSERTAR PLANTILLAS DE EMAIL
-- ========================================

INSERT INTO public.email_templates (template_key, template_name, subject, html_content, text_content, variables) VALUES
(
    'reservation_confirmation',
    'Confirmación de Reserva',
    'Tu reserva en Coolbalu fue creada exitosamente',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirmación de Reserva - Coolbalu</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">¡Hola {{customerName}}!</h1>
        <p>Tu reserva en <strong>Coolbalu</strong> fue creada exitosamente.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af;">Detalles de tu reserva:</h2>
            <p><strong>ID de Reserva:</strong> {{reservationId}}</p>
            <p><strong>Fecha:</strong> {{eventDate}}</p>
            <p><strong>Hora:</strong> {{eventTime}}</p>
            <p><strong>Dirección:</strong> {{eventAddress}}</p>
            <p><strong>Total:</strong> ${{total}}</p>
        </div>
        
        <p>Te contactaremos pronto para coordinar los detalles finales.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280;">
                Saludos,<br>
                El equipo de Coolbalu
            </p>
        </div>
    </div>
</body>
</html>',
    'Hola {{customerName}}!

Tu reserva en Coolbalu fue creada exitosamente.

Detalles de tu reserva:
- ID de Reserva: {{reservationId}}
- Fecha: {{eventDate}}
- Hora: {{eventTime}}
- Dirección: {{eventAddress}}
- Total: ${{total}}

Te contactaremos pronto para coordinar los detalles finales.

Saludos,
El equipo de Coolbalu',
    '["customerName", "reservationId", "eventDate", "eventTime", "eventAddress", "total"]'
),
(
    'contact_form_notification',
    'Notificación de Formulario de Contacto',
    'Nuevo mensaje de contacto recibido',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nuevo Mensaje de Contacto - Coolbalu</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Nuevo mensaje de contacto</h1>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nombre:</strong> {{nombre}} {{apellido}}</p>
            <p><strong>Email:</strong> {{email}}</p>
            <p><strong>Teléfono:</strong> {{telefono}}</p>
            <p><strong>Mensaje:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                {{mensaje}}
            </div>
        </div>
        
        <p>Responder a: <a href="mailto:{{email}}">{{email}}</a></p>
    </div>
</body>
</html>',
    'Nuevo mensaje de contacto

Nombre: {{nombre}} {{apellido}}
Email: {{email}}
Teléfono: {{telefono}}

Mensaje:
{{mensaje}}

Responder a: {{email}}',
    '["nombre", "apellido", "email", "telefono", "mensaje"]'
),
(
    'payment_confirmation',
    'Confirmación de Pago',
    'Pago confirmado - Tu reserva está confirmada',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pago Confirmado - Coolbalu</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">¡Pago confirmado!</h1>
        <p>Tu reserva en <strong>Coolbalu</strong> ha sido confirmada.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #047857;">Detalles de la reserva:</h2>
            <p><strong>ID de Reserva:</strong> {{reservationId}}</p>
            <p><strong>Fecha:</strong> {{eventDate}}</p>
            <p><strong>Hora:</strong> {{eventTime}}</p>
            <p><strong>Dirección:</strong> {{eventAddress}}</p>
            <p><strong>Total pagado:</strong> ${{total}}</p>
        </div>
        
        <p>¡Nos vemos en tu evento!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280;">
                Saludos,<br>
                El equipo de Coolbalu
            </p>
        </div>
    </div>
</body>
</html>',
    '¡Pago confirmado!

Tu reserva en Coolbalu ha sido confirmada.

Detalles de la reserva:
- ID de Reserva: {{reservationId}}
- Fecha: {{eventDate}}
- Hora: {{eventTime}}
- Dirección: {{eventAddress}}
- Total pagado: ${{total}}

¡Nos vemos en tu evento!

Saludos,
El equipo de Coolbalu',
    '["reservationId", "eventDate", "eventTime", "eventAddress", "total"]'
)
ON CONFLICT (template_key) DO NOTHING;

-- ========================================
-- 5. INSERTAR CONFIGURACIÓN DE EMAIL
-- ========================================

INSERT INTO public.email_config (config_key, config_value, description, is_sensitive) VALUES
('sender_email', 'hola@estudiomaters.com', 'Email del remitente', false),
('sender_name', 'Coolbalu', 'Nombre del remitente', false),
('reply_to_email', 'info@coolbalu.com', 'Email de respuesta', false),
('max_retries', '3', 'Número máximo de reintentos para envío de emails', false),
('retry_delay_minutes', '5', 'Delay entre reintentos en minutos', false),
('enable_email_logging', 'true', 'Habilitar logging de emails', false),
('admin_notification_email', 'admin@coolbalu.com', 'Email para notificaciones de administrador', false)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 6. HABILITAR RLS EN TABLAS DE EMAIL
-- ========================================

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. CREAR POLÍTICAS RLS PARA EMAIL_LOGS
-- ========================================

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

-- ========================================
-- 8. CREAR POLÍTICAS RLS PARA EMAIL_TEMPLATES
-- ========================================

DROP POLICY IF EXISTS "admins_full_access_email_templates" ON public.email_templates;
CREATE POLICY "admins_full_access_email_templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- ========================================
-- 9. CREAR POLÍTICAS RLS PARA EMAIL_CONFIG
-- ========================================

DROP POLICY IF EXISTS "admins_full_access_email_config" ON public.email_config;
CREATE POLICY "admins_full_access_email_config" ON public.email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- ========================================
-- 10. CREAR FUNCIONES HELPER
-- ========================================

-- Función para obtener el email de un usuario por su user_id
CREATE OR REPLACE FUNCTION get_user_email(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Obtener el email del usuario desde auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id_param;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener configuración de email
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

-- Función para obtener plantilla de email
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

-- Función para registrar email enviado
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

-- ========================================
-- 11. CREAR TRIGGERS PARA TIMESTAMPS
-- ========================================

-- Función para actualizar updated_at en email_templates
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at en email_config
CREATE OR REPLACE FUNCTION update_email_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
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

-- ========================================
-- 12. AGREGAR FOREIGN KEYS SI LAS TABLAS EXISTEN
-- ========================================

-- Verificar si existe la tabla reservations y agregar foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
        ALTER TABLE public.email_logs 
        ADD CONSTRAINT fk_email_logs_reservation_id 
        FOREIGN KEY (related_reservation_id) 
        REFERENCES public.reservations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Verificar si existe la tabla contact_messages y agregar foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_messages') THEN
        ALTER TABLE public.email_logs 
        ADD CONSTRAINT fk_email_logs_contact_message_id 
        FOREIGN KEY (related_contact_message_id) 
        REFERENCES public.contact_messages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ========================================
-- 13. VERIFICACIÓN FINAL
-- ========================================

SELECT '✅ Sistema de emails configurado exitosamente!' as status;
SELECT '📧 Tablas creadas: contact_messages, email_logs, email_templates, email_config' as info;
SELECT '🔒 Políticas RLS configuradas' as info;
SELECT '⚙️ Funciones helper creadas' as info;
SELECT '📝 Plantillas de email cargadas' as info;
SELECT '🎯 Configuración establecida' as info; 