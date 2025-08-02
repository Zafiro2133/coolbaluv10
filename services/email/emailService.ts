import { Resend } from 'resend';
import { EmailData, EmailLog, EmailType } from './emailTypes';
import { supabase } from '../supabase/client';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

const FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL || 'hola@estudiomaters.com';
const FROM_NAME = import.meta.env.VITE_APP_NAME || 'Coolbalu';

export class EmailService {
  private static async logEmail(
    emailType: EmailType,
    recipientEmail: string,
    subject: string,
    status: 'sent' | 'failed' | 'pending',
    userId?: string,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_type: emailType,
          recipient_email: recipientEmail,
          subject,
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          error_message: errorMessage,
          metadata
        });

      if (error) {
        console.error('Error logging email:', error);
      }
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  static async sendEmail(emailData: EmailData, emailType: EmailType, userId?: string): Promise<boolean> {
    try {
      // Log email as pending
      await this.logEmail(emailType, emailData.to, emailData.subject, 'pending', userId);

      const response = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      if (response.error) {
        console.error('Resend error:', response.error);
        await this.logEmail(emailType, emailData.to, emailData.subject, 'failed', userId, response.error.message);
        return false;
      }

      // Log successful email
      await this.logEmail(emailType, emailData.to, emailData.subject, 'sent', userId);
      console.log(`Email sent successfully to ${emailData.to}`);
      return true;

    } catch (error) {
      console.error('Email service error:', error);
      await this.logEmail(
        emailType, 
        emailData.to, 
        emailData.subject, 
        'failed', 
        userId, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }

  static async sendAccountActivationEmail(email: string, name: string, activationToken: string): Promise<boolean> {
    // Usar el sistema de Supabase Auth nativo en lugar del sistema personalizado
    // El token será manejado automáticamente por Supabase
    const activationUrl = `${window.location.origin}/confirm-email`;
    
    const emailData: EmailData = {
      to: email,
      subject: 'Activa tu cuenta - Coolbalu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Coolbalu!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hola ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Gracias por registrarte en Coolbalu. Para completar tu registro y activar tu cuenta, 
              haz clic en el botón de abajo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Activar Mi Cuenta
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:
            </p>
            
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; color: #666;">
              ${activationUrl}
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px; font-size: 14px;">
              Este enlace expirará en 24 horas por seguridad.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Si no solicitaste esta cuenta, puedes ignorar este email.
            </p>
          </div>
        </div>
      `
    };

    return this.sendEmail(emailData, 'account-activation');
  }

  static async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: '¡Bienvenido a Coolbalu! Tu cuenta está activa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Cuenta Activada!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              ¡Excelente! Tu cuenta ha sido activada exitosamente. Ya puedes disfrutar de todos 
              los servicios que Coolbalu tiene para ofrecerte.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">¿Qué puedes hacer ahora?</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Explorar nuestro catálogo de productos</li>
                <li>Crear reservas para tus eventos</li>
                <li>Gestionar tu perfil y preferencias</li>
                <li>Ver el historial de tus reservas</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Ir a Coolbalu
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              ¡Gracias por elegir Coolbalu!
            </p>
          </div>
        </div>
      `
    };

    return this.sendEmail(emailData, 'welcome');
  }

  static async sendReservationCreatedEmail(reservationData: ReservationEmailData): Promise<boolean> {
    const itemsList = reservationData.items.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString()}</td>
      </tr>`
    ).join('');

    const emailData: EmailData = {
      to: reservationData.customerEmail,
      subject: `Reserva #${reservationData.reservationId} - Detalles de Pago`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reserva Creada</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hola ${reservationData.customerName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Tu reserva ha sido creada exitosamente. Aquí tienes todos los detalles:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Detalles de la Reserva</h3>
              <p><strong>Número de Reserva:</strong> #${reservationData.reservationId}</p>
              <p><strong>Fecha de Reserva:</strong> ${reservationData.reservationDate}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Productos Reservados</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Cantidad</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
                <tfoot>
                  <tr style="background: #f8f9fa; font-weight: bold;">
                    <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
                    <td style="padding: 10px; text-align: right;">$${reservationData.totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin-top: 0;">Datos para el Pago</h3>
              <p><strong>Banco:</strong> ${reservationData.paymentDetails.bankName}</p>
              <p><strong>Titular:</strong> ${reservationData.paymentDetails.accountHolder}</p>
              <p><strong>Número de Cuenta:</strong> ${reservationData.paymentDetails.accountNumber}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Importante</h3>
              <p style="color: #856404; margin-bottom: 10px;">
                Una vez realizado el pago, envía el comprobante por WhatsApp al administrador 
                para confirmar tu reserva.
              </p>
              <p style="color: #856404; margin: 0;">
                Tu reserva quedará pendiente hasta que se confirme el pago.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Gracias por elegir Coolbalu para tu evento.
            </p>
          </div>
        </div>
      `
    };

    return this.sendEmail(emailData, 'reservation-created');
  }

  static async sendAdminNewReservationEmail(adminData: AdminEmailData): Promise<boolean> {
    const emailData: EmailData = {
      to: adminData.adminEmail,
      subject: `Nueva Reserva #${adminData.reservationId} - Pendiente de Pago`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nueva Reserva</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hola Administrador,</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Se ha creado una nueva reserva que está pendiente de pago. Aquí tienes los detalles:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Detalles de la Reserva</h3>
              <p><strong>Número de Reserva:</strong> #${adminData.reservationId}</p>
              <p><strong>Cliente:</strong> ${adminData.customerName}</p>
              <p><strong>Email del Cliente:</strong> ${adminData.customerEmail}</p>
              <p><strong>Total:</strong> $${adminData.totalAmount.toLocaleString()}</p>
              <p><strong>Productos:</strong> ${adminData.itemsCount} item(s)</p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">Estado: Pendiente de Pago</h3>
              <p style="color: #856404; margin-bottom: 10px;">
                El cliente debe enviar el comprobante de pago por WhatsApp para confirmar la reserva.
              </p>
              <p style="color: #856404; margin: 0;">
                Una vez recibido el comprobante, puedes confirmar la reserva desde el panel de administración.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/admin/reservations" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Ver Reserva
              </a>
            </div>
          </div>
        </div>
      `
    };

    return this.sendEmail(emailData, 'admin-new-reservation');
  }

  static async sendReservationConfirmedEmail(reservationData: ReservationEmailData): Promise<boolean> {
    const itemsList = reservationData.items.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString()}</td>
      </tr>`
    ).join('');

    const emailData: EmailData = {
      to: reservationData.customerEmail,
      subject: `¡Reserva #${reservationData.reservationId} Confirmada!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Reserva Confirmada!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${reservationData.customerName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              ¡Excelente! Tu reserva ha sido confirmada exitosamente. El pago ha sido verificado 
              y tu reserva está lista.
            </p>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin-top: 0;">✅ Estado: Confirmada</h3>
              <p style="color: #155724; margin-bottom: 10px;">
                Tu reserva está confirmada y lista para el evento.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Detalles de la Reserva</h3>
              <p><strong>Número de Reserva:</strong> #${reservationData.reservationId}</p>
              <p><strong>Fecha de Reserva:</strong> ${reservationData.reservationDate}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Productos Confirmados</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Cantidad</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
                <tfoot>
                  <tr style="background: #f8f9fa; font-weight: bold;">
                    <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
                    <td style="padding: 10px; text-align: right;">$${reservationData.totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h3 style="color: #004085; margin-top: 0;">📋 Información Importante</h3>
              <ul style="color: #004085; line-height: 1.8;">
                <li>Guarda este email como comprobante de tu reserva</li>
                <li>Presenta el número de reserva #${reservationData.reservationId} el día del evento</li>
                <li>Si necesitas hacer cambios, contacta con anticipación</li>
                <li>¡Disfruta de tu evento!</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/profile" 
                 style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);">
                Ver Mis Reservas
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Gracias por confiar en Coolbalu. ¡Esperamos que disfrutes de tu evento!
            </p>
          </div>
        </div>
      `
    };

    return this.sendEmail(emailData, 'reservation-confirmed');
  }
} 