import { supabase } from './client';
import { RESEND_API_KEY } from '@/config/resend';

// Tipos para el sistema de emails
export interface EmailTemplate {
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
}

export interface EmailConfig {
  sender_email: string;
  sender_name: string;
  reply_to_email: string;
  max_retries: number;
  retry_delay_minutes: number;
  enable_email_logging: boolean;
  admin_notification_email: string;
}

export interface EmailLog {
  id: string;
  email_type: 'reservation_confirmation' | 'reservation_update' | 'contact_form' | 'admin_notification' | 'payment_confirmation';
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  error_message?: string;
  metadata?: Record<string, any>;
  related_reservation_id?: string;
  related_contact_message_id?: string;
  sent_at: string;
  created_at: string;
}

// Función para obtener configuración de email desde Supabase
export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const { data, error } = await supabase
      .from('email_config')
      .select('config_key, config_value');

    if (error) {
      console.error('❌ Error al obtener configuración de email:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No se encontró configuración de email');
      return null;
    }

    // Convertir array de configuraciones a objeto
    const config: Partial<EmailConfig> = {};
    data.forEach(item => {
      switch (item.config_key) {
        case 'sender_email':
          config.sender_email = item.config_value;
          break;
        case 'sender_name':
          config.sender_name = item.config_value;
          break;
        case 'reply_to_email':
          config.reply_to_email = item.config_value;
          break;
        case 'max_retries':
          config.max_retries = parseInt(item.config_value);
          break;
        case 'retry_delay_minutes':
          config.retry_delay_minutes = parseInt(item.config_value);
          break;
        case 'enable_email_logging':
          config.enable_email_logging = item.config_value === 'true';
          break;
        case 'admin_notification_email':
          config.admin_notification_email = item.config_value;
          break;
      }
    });

    return config as EmailConfig;
  } catch (error) {
    console.error('❌ Error en getEmailConfig:', error);
    return null;
  }
}

// Función para obtener plantilla de email desde Supabase
export async function getEmailTemplate(templateKey: string): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('subject, html_content, text_content, variables')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error al obtener plantilla de email:', error);
      return null;
    }

    if (!data) {
      console.warn(`⚠️ No se encontró plantilla de email: ${templateKey}`);
      return null;
    }

    return {
      subject: data.subject,
      html_content: data.html_content,
      text_content: data.text_content,
      variables: data.variables || []
    };
  } catch (error) {
    console.error('❌ Error en getEmailTemplate:', error);
    return null;
  }
}

// Función para reemplazar variables en plantillas
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
  });
  
  return result;
}

// Función para registrar email enviado en Supabase
export async function logEmailSent(
  emailType: EmailLog['email_type'],
  recipientEmail: string,
  recipientName: string,
  subject: string,
  content: string,
  metadata: Record<string, any> = {},
  relatedReservationId?: string,
  relatedContactMessageId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('log_email_sent', {
        email_type_param: emailType,
        recipient_email_param: recipientEmail,
        recipient_name_param: recipientName,
        subject_param: subject,
        content_param: content,
        metadata_param: metadata,
        related_reservation_id_param: relatedReservationId,
        related_contact_message_id_param: relatedContactMessageId
      });

    if (error) {
      console.error('❌ Error al registrar email:', error);
      return null;
    }

    console.log('✅ Email registrado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en logEmailSent:', error);
    return null;
  }
}

// Función para enviar email usando Resend y registrar en Supabase
export async function sendEmailWithLogging(
  templateKey: string,
  recipientEmail: string,
  recipientName: string,
  variables: Record<string, any>,
  metadata: Record<string, any> = {},
  relatedReservationId?: string,
  relatedContactMessageId?: string
): Promise<{ success: boolean; error?: string; logId?: string }> {
  try {
    console.log('📧 Enviando email con plantilla:', templateKey);

    // Obtener plantilla
    const template = await getEmailTemplate(templateKey);
    if (!template) {
      return { success: false, error: 'No se pudo obtener la plantilla de email' };
    }

    // Obtener configuración
    const config = await getEmailConfig();
    if (!config) {
      return { success: false, error: 'No se pudo obtener la configuración de email' };
    }

    // Reemplazar variables en la plantilla
    const subject = replaceTemplateVariables(template.subject, variables);
    const htmlContent = replaceTemplateVariables(template.html_content, variables);
    const textContent = template.text_content ? replaceTemplateVariables(template.text_content, variables) : undefined;

    // Preparar datos para Resend
    const emailData = {
      from: `${config.sender_name} <${config.sender_email}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      text: textContent,
      reply_to: config.reply_to_email
    };

    // Enviar email usando Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error al enviar email con Resend:', errorData);
      
      // Registrar email fallido
      if (config.enable_email_logging) {
        await logEmailSent(
          'reservation_confirmation',
          recipientEmail,
          recipientName,
          subject,
          htmlContent,
          { ...metadata, resend_error: errorData },
          relatedReservationId,
          relatedContactMessageId
        );
      }
      
      return { 
        success: false, 
        error: `Error al enviar email: ${errorData.message || 'Error desconocido'}` 
      };
    }

    const result = await response.json();
    console.log('✅ Email enviado exitosamente:', result);

    // Registrar email exitoso
    let logId: string | null = null;
    if (config.enable_email_logging) {
      logId = await logEmailSent(
        'reservation_confirmation',
        recipientEmail,
        recipientName,
        subject,
        htmlContent,
        { ...metadata, resend_id: result.id },
        relatedReservationId,
        relatedContactMessageId
      );
    }

    return { success: true, logId };
  } catch (error) {
    console.error('❌ Error en sendEmailWithLogging:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email' 
    };
  }
}

// Función para obtener logs de email
export async function getEmailLogs(
  filters: {
    emailType?: EmailLog['email_type'];
    status?: EmailLog['status'];
    recipientEmail?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<EmailLog[] | null> {
  try {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    if (filters.emailType) {
      query = query.eq('email_type', filters.emailType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.recipientEmail) {
      query = query.eq('recipient_email', filters.recipientEmail);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error al obtener logs de email:', error);
      return null;
    }

    return data as EmailLog[];
  } catch (error) {
    console.error('❌ Error en getEmailLogs:', error);
    return null;
  }
}

// Función para actualizar estado de email
export async function updateEmailStatus(
  logId: string,
  status: EmailLog['status'],
  errorMessage?: string
): Promise<boolean> {
  try {
    const updateData: any = { status };
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) {
      console.error('❌ Error al actualizar estado de email:', error);
      return false;
    }

    console.log('✅ Estado de email actualizado:', logId, status);
    return true;
  } catch (error) {
    console.error('❌ Error en updateEmailStatus:', error);
    return false;
  }
}

// Función para enviar email de confirmación de reserva
export async function sendReservationConfirmationEmail(
  reservationData: {
    reservationId: string;
    customerName: string;
    customerEmail: string;
    eventDate: string;
    eventTime: string;
    eventAddress: string;
    total: number;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      extraHours: number;
      itemTotal: number;
    }>;
  }
): Promise<{ success: boolean; error?: string; logId?: string }> {
  const variables = {
    customerName: reservationData.customerName,
    reservationId: reservationData.reservationId,
    eventDate: reservationData.eventDate,
    eventTime: reservationData.eventTime,
    eventAddress: reservationData.eventAddress,
    total: reservationData.total.toLocaleString('es-AR'),
    items: reservationData.items.map(item => 
      `${item.productName} x${item.quantity} - $${item.itemTotal.toLocaleString('es-AR')}`
    ).join('\n')
  };

  return await sendEmailWithLogging(
    'reservation_confirmation',
    reservationData.customerEmail,
    reservationData.customerName,
    variables,
    { reservation_id: reservationData.reservationId },
    reservationData.reservationId
  );
}

// Función para enviar notificación de formulario de contacto
export async function sendContactFormNotification(
  contactData: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    mensaje: string;
    contactMessageId: string;
  }
): Promise<{ success: boolean; error?: string; logId?: string }> {
  const variables = {
    nombre: contactData.nombre,
    apellido: contactData.apellido,
    email: contactData.email,
    telefono: contactData.telefono,
    mensaje: contactData.mensaje
  };

  // Obtener configuración para el email del admin
  const config = await getEmailConfig();
  if (!config) {
    return { success: false, error: 'No se pudo obtener la configuración de email' };
  }

  return await sendEmailWithLogging(
    'contact_form_notification',
    config.admin_notification_email,
    'Administrador',
    variables,
    { contact_message_id: contactData.contactMessageId },
    undefined,
    contactData.contactMessageId
  );
} 