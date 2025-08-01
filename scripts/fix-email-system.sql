-- Script para solucionar problemas del sistema de email
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar si las tablas existen y crear si no existen
CREATE TABLE IF NOT EXISTS public.email_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('reservation_confirmation', 'reservation_update', 'contact_form', 'admin_notification', 'payment_confirmation')),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(200),
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    related_reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    related_contact_message_id UUID REFERENCES public.contact_messages(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_email_config_key ON public.email_config(config_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_reservation ON public.email_logs(related_reservation_id);

-- 3. Insertar configuración de email
INSERT INTO public.email_config (config_key, config_value, description, is_sensitive) VALUES
('sender_email', 'hola@estudiomaters.com', 'Email del remitente', false),
('sender_name', 'Coolbalu', 'Nombre del remitente', false),
('reply_to_email', 'info@coolbalu.com', 'Email de respuesta', false),
('max_retries', '3', 'Número máximo de reintentos para envío de emails', false),
('retry_delay_minutes', '5', 'Delay entre reintentos en minutos', false),
('enable_email_logging', 'true', 'Habilitar logging de emails', false),
('admin_notification_email', 'admin@coolbalu.com', 'Email para notificaciones de administrador', false)
ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. Insertar plantillas de email
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
ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    subject = EXCLUDED.subject,
    html_content = EXCLUDED.html_content,
    text_content = EXCLUDED.text_content,
    variables = EXCLUDED.variables,
    updated_at = NOW();

-- 5. Crear función get_user_email
CREATE OR REPLACE FUNCTION public.get_user_email(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id_param;
    
    RETURN user_email;
END;
$$;

-- 6. Crear función log_email_sent
CREATE OR REPLACE FUNCTION public.log_email_sent(
    email_type_param VARCHAR(50),
    recipient_email_param VARCHAR(255),
    recipient_name_param VARCHAR(200),
    subject_param VARCHAR(500),
    content_param TEXT,
    metadata_param JSONB DEFAULT '{}',
    related_reservation_id_param UUID DEFAULT NULL,
    related_contact_message_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
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
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- 7. Habilitar RLS
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas RLS para email_config (acceso público para lectura)
DROP POLICY IF EXISTS "public_read_email_config" ON public.email_config;
CREATE POLICY "public_read_email_config" ON public.email_config
    FOR SELECT USING (true);

-- Solo admins pueden modificar configuración
DROP POLICY IF EXISTS "admins_modify_email_config" ON public.email_config;
CREATE POLICY "admins_modify_email_config" ON public.email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- 9. Crear políticas RLS para email_templates (acceso público para lectura)
DROP POLICY IF EXISTS "public_read_email_templates" ON public.email_templates;
CREATE POLICY "public_read_email_templates" ON public.email_templates
    FOR SELECT USING (true);

-- Solo admins pueden modificar plantillas
DROP POLICY IF EXISTS "admins_modify_email_templates" ON public.email_templates;
CREATE POLICY "admins_modify_email_templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- 10. Crear políticas RLS para email_logs (solo admins)
DROP POLICY IF EXISTS "admins_full_access_email_logs" ON public.email_logs;
CREATE POLICY "admins_full_access_email_logs" ON public.email_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- 11. Crear triggers para updated_at
CREATE OR REPLACE FUNCTION update_email_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_config_updated_at ON public.email_config;
CREATE TRIGGER trigger_update_email_config_updated_at
    BEFORE UPDATE ON public.email_config
    FOR EACH ROW
    EXECUTE FUNCTION update_email_config_updated_at();

DROP TRIGGER IF EXISTS trigger_update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER trigger_update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updated_at();

-- 12. Verificar que todo esté configurado correctamente
SELECT '✅ Sistema de email configurado correctamente' as status;
SELECT COUNT(*) as email_config_count FROM public.email_config;
SELECT COUNT(*) as email_templates_count FROM public.email_templates WHERE is_active = true; 