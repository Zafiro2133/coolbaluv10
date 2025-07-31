import { Resend } from 'resend';
import type { Tables } from './types';

// Configuración de Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_BtA3bmsH_HCeHbsLGqwkmF4iy5dHyDg7t');

// Tipos para los datos de reserva
export interface ReservationEmailData {
  id: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  fecha: string;
  hora: string;
  direccion: string;
  zona?: string;
  adultos: number;
  ninos: number;
  comentarios?: string;
  reprogramacionLluvia?: string;
  horasExtra: number;
  subtotal: number;
  costoTransporte: number;
  total: number;
  items: Array<{
    nombre: string;
    precio: number;
    cantidad: number;
    horasExtra: number;
    total: number;
  }>;
}

// Configuración de correos
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hola@estudiomaters.com';
const FROM_EMAIL = 'noreply@coolbalu.com';

/**
 * Convierte los datos de reserva de Supabase al formato requerido para los correos
 */
function transformReservationData(reservation: Tables<'reservations'> & {
  reservation_items?: Tables<'reservation_items'>[];
  user_profile?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  };
  zone?: {
    name: string;
  } | null;
}): ReservationEmailData {
  const nombreCompleto = [
    reservation.user_profile?.first_name,
    reservation.user_profile?.last_name
  ].filter(Boolean).join(' ') || 'Cliente';

  return {
    id: reservation.id,
    clienteNombre: nombreCompleto,
    clienteEmail: '', // Se obtendrá del contexto de autenticación
    clienteTelefono: reservation.phone,
    fecha: reservation.event_date,
    hora: reservation.event_time,
    direccion: reservation.event_address,
    zona: reservation.zone?.name,
    adultos: reservation.adult_count,
    ninos: reservation.child_count,
    comentarios: reservation.comments || undefined,
    reprogramacionLluvia: reservation.rain_reschedule,
    horasExtra: reservation.extra_hours,
    subtotal: reservation.subtotal,
    costoTransporte: reservation.transport_cost,
    total: reservation.total,
    items: reservation.reservation_items?.map(item => ({
      nombre: item.product_name,
      precio: item.product_price,
      cantidad: item.quantity,
      horasExtra: item.extra_hours,
      total: item.item_total
    })) || []
  };
}

/**
 * Genera el HTML del correo para el cliente
 */
function generateClientEmailHTML(data: ReservationEmailData): string {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.nombre}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.horasExtra}h</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Reserva - CoolBalu</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .payment-info { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding: 20px; background: #f3f4f6; border-radius: 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ¡Reserva Confirmada!</h1>
          <p>Tu evento ha sido reservado exitosamente</p>
        </div>
        
        <div class="content">
          <h2>Hola ${data.clienteNombre},</h2>
          <p>¡Gracias por elegir CoolBalu para tu evento! Tu reserva ha sido confirmada y estamos emocionados de ser parte de tu celebración.</p>
          
          <div class="details">
            <h3>📋 Detalles de tu Reserva</h3>
            <p><strong>Número de Reserva:</strong> #${data.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
            <p><strong>Hora:</strong> ${data.hora}</p>
            <p><strong>Dirección:</strong> ${data.direccion}</p>
            ${data.zona ? `<p><strong>Zona:</strong> ${data.zona}</p>` : ''}
            <p><strong>Invitados:</strong> ${data.adultos} adultos, ${data.ninos} niños</p>
            ${data.comentarios ? `<p><strong>Comentarios:</strong> ${data.comentarios}</p>` : ''}
            ${data.reprogramacionLluvia !== 'no' ? `<p><strong>Plan de Lluvia:</strong> ${data.reprogramacionLluvia === 'indoor' ? 'Evento bajo techo' : 'Reprogramación'}</p>` : ''}
          </div>
          
          <div class="details">
            <h3>🛍️ Servicios Reservados</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: center;">Horas Extra</th>
                  <th style="text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div class="total">
              <p>Subtotal: ${formatCurrency(data.subtotal)}</p>
              <p>Costo de Transporte: ${formatCurrency(data.costoTransporte)}</p>
              <p style="font-size: 20px; color: #059669;">Total: ${formatCurrency(data.total)}</p>
            </div>
          </div>
          
          <div class="payment-info">
            <h3>💳 Información de Pago</h3>
            <p><strong>Estado:</strong> Pendiente de Pago</p>
            <p>Para confirmar tu reserva, por favor realiza el pago del 50% del total (${formatCurrency(data.total * 0.5)}) a través de:</p>
            <ul>
              <li><strong>Transferencia Bancaria:</strong> [Datos bancarios]</li>
              <li><strong>Mercado Pago:</strong> [Link de pago]</li>
            </ul>
            <p>Una vez realizado el pago, envía el comprobante a través de tu perfil en la web.</p>
          </div>
          
          <div class="details">
            <h3>📞 Contacto</h3>
            <p>Si tienes alguna pregunta o necesitas hacer cambios en tu reserva, no dudes en contactarnos:</p>
            <p><strong>Teléfono:</strong> [Número de contacto]</p>
            <p><strong>Email:</strong> info@coolbalu.com</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://coolbalu.com/profile" class="button">Ver mi Reserva</a>
          </div>
        </div>
        
        <div class="footer">
          <p>© 2024 CoolBalu. Todos los derechos reservados.</p>
          <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera el HTML del correo para el admin
 */
function generateAdminEmailHTML(data: ReservationEmailData): string {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.nombre}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.horasExtra}h</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva Reserva - CoolBalu</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .urgent { background: #fef2f2; border: 1px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding: 20px; background: #f3f4f6; border-radius: 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🆕 Nueva Reserva Recibida</h1>
          <p>Un cliente ha realizado una nueva reserva</p>
        </div>
        
        <div class="content">
          <div class="urgent">
            <h3>⚠️ Acción Requerida</h3>
            <p>Se ha recibido una nueva reserva que requiere tu atención. El cliente debe realizar el pago para confirmar la reserva.</p>
          </div>
          
          <div class="details">
            <h3>👤 Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${data.clienteNombre}</p>
            <p><strong>Email:</strong> ${data.clienteEmail}</p>
            <p><strong>Teléfono:</strong> ${data.clienteTelefono}</p>
            <p><strong>Número de Reserva:</strong> #${data.id.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <div class="details">
            <h3>📅 Detalles del Evento</h3>
            <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
            <p><strong>Hora:</strong> ${data.hora}</p>
            <p><strong>Dirección:</strong> ${data.direccion}</p>
            ${data.zona ? `<p><strong>Zona:</strong> ${data.zona}</p>` : ''}
            <p><strong>Invitados:</strong> ${data.adultos} adultos, ${data.ninos} niños</p>
            ${data.comentarios ? `<p><strong>Comentarios:</strong> ${data.comentarios}</p>` : ''}
            ${data.reprogramacionLluvia !== 'no' ? `<p><strong>Plan de Lluvia:</strong> ${data.reprogramacionLluvia === 'indoor' ? 'Evento bajo techo' : 'Reprogramación'}</p>` : ''}
          </div>
          
          <div class="details">
            <h3>🛍️ Servicios Solicitados</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: center;">Horas Extra</th>
                  <th style="text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div class="total">
              <p>Subtotal: ${formatCurrency(data.subtotal)}</p>
              <p>Costo de Transporte: ${formatCurrency(data.costoTransporte)}</p>
              <p style="font-size: 20px; color: #dc2626;">Total: ${formatCurrency(data.total)}</p>
              <p style="font-size: 16px; color: #059669;">Pago Requerido (50%): ${formatCurrency(data.total * 0.5)}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://coolbalu.com/admin/reservations" class="button">Ver en Dashboard</a>
          </div>
        </div>
        
        <div class="footer">
          <p>© 2024 CoolBalu. Sistema de Notificaciones.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envía los correos de confirmación de reserva
 * @param reservation - Datos de la reserva desde Supabase
 * @param clienteEmail - Email del cliente (se obtiene del contexto de autenticación)
 */
export async function sendReservationEmails(
  reservation: Tables<'reservations'> & {
    reservation_items?: Tables<'reservation_items'>[];
    user_profile?: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
    };
    zone?: {
      name: string;
    } | null;
  },
  clienteEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar datos requeridos
    if (!reservation) {
      throw new Error('Datos de reserva no proporcionados');
    }

    if (!clienteEmail || !clienteEmail.includes('@')) {
      throw new Error('Email del cliente no válido');
    }

    // Transformar datos
    const emailData = transformReservationData(reservation);
    emailData.clienteEmail = clienteEmail;

    // Validar API key de Resend
    if (!process.env.RESEND_API_KEY) {
      throw new Error('API key de Resend no configurada');
    }

    // Enviar correo al cliente
    const clientEmailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [clienteEmail],
      subject: `🎉 Confirmación de Reserva #${reservation.id.slice(0, 8).toUpperCase()} - CoolBalu`,
      html: generateClientEmailHTML(emailData),
    });

    if (clientEmailResult.error) {
      console.error('Error enviando correo al cliente:', clientEmailResult.error);
      throw new Error(`Error enviando correo al cliente: ${clientEmailResult.error.message}`);
    }

    // Enviar correo al admin
    const adminEmailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `🆕 Nueva Reserva #${reservation.id.slice(0, 8).toUpperCase()} - ${emailData.clienteNombre}`,
      html: generateAdminEmailHTML(emailData),
    });

    if (adminEmailResult.error) {
      console.error('Error enviando correo al admin:', adminEmailResult.error);
      throw new Error(`Error enviando correo al admin: ${adminEmailResult.error.message}`);
    }

    console.log('✅ Correos enviados exitosamente:', {
      cliente: clienteEmail,
      admin: ADMIN_EMAIL,
      reservationId: reservation.id
    });

    return { success: true };

  } catch (error) {
    console.error('❌ Error en sendReservationEmails:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Función de utilidad para validar si una reserva está completa
 */
export function isReservationComplete(reservation: Tables<'reservations'>): boolean {
  return !!(
    reservation.id &&
    reservation.user_id &&
    reservation.event_date &&
    reservation.event_time &&
    reservation.event_address &&
    reservation.total > 0
  );
}

/**
 * Función de utilidad para obtener el email del cliente desde el contexto de autenticación
 * Esta función debe ser llamada desde el contexto donde se tiene acceso al usuario autenticado
 */
export async function getClientEmail(userId: string): Promise<string | null> {
  try {
    // Aquí deberías obtener el email del usuario desde Supabase Auth
    // Por ahora retornamos null para que se pase explícitamente
    return null;
  } catch (error) {
    console.error('Error obteniendo email del cliente:', error);
    return null;
  }
} 