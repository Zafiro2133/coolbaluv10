import { supabase } from './supabase/client';
import { 
  sendReservationConfirmationEmail as sendReservationEmailWithLogging,
  sendContactFormNotification as sendContactNotificationWithLogging,
  getEmailLogs,
  updateEmailStatus,
  type ReservationEmailData 
} from './supabase/email';

// Función para enviar email de confirmación de reserva (actualizada)
export async function sendReservationConfirmationEmail(
  reservationData: ReservationEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Enviando email de confirmación para reserva:', reservationData.reservationId);

    // Usar el nuevo sistema con logging
    const result = await sendReservationEmailWithLogging({
      reservationId: reservationData.reservationId,
      customerName: reservationData.customerName,
      customerEmail: reservationData.customerEmail,
      eventDate: reservationData.eventDate,
      eventTime: reservationData.eventTime,
      eventAddress: reservationData.eventAddress,
      total: reservationData.total,
      items: reservationData.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        extraHours: item.extraHours,
        itemTotal: item.itemTotal
      }))
    });

    if (!result.success) {
      console.error('❌ Error al enviar email:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Email enviado exitosamente con ID de log:', result.logId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en sendReservationConfirmationEmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email' 
    };
  }
}

// Función para obtener datos completos de la reserva para el email
export async function getReservationEmailData(reservationId: string): Promise<ReservationEmailData | null> {
  try {
    // Obtener la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (reservationError) {
      console.error('❌ Error al obtener datos de reserva:', reservationError);
      return null;
    }

    if (!reservation) {
      console.error('❌ No se encontró la reserva');
      return null;
    }

    // Obtener el email del usuario usando la función RPC
    const { data: userEmail, error: userError } = await supabase.rpc('get_user_email', {
      user_id_param: reservation.user_id
    });
    
    if (userError) {
      console.error('❌ Error al obtener email del usuario:', userError);
      return null;
    }

    // Obtener el perfil del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', reservation.user_id)
      .single();

    if (profileError) {
      console.warn('⚠️ No se pudo obtener el perfil del usuario:', profileError);
    }

    // Obtener los items de la reserva
    const { data: reservationItems, error: itemsError } = await supabase
      .from('reservation_items')
      .select('*')
      .eq('reservation_id', reservationId);

    if (itemsError) {
      console.error('❌ Error al obtener items de la reserva:', itemsError);
      return null;
    }

    // Formatear los datos para el email
    const emailData: ReservationEmailData = {
      reservationId: reservation.id,
      customerName: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Cliente',
      customerEmail: userEmail || '',
      eventDate: reservation.event_date,
      eventTime: reservation.event_time,
      eventAddress: reservation.event_address,
      adultCount: reservation.adult_count,
      childCount: reservation.child_count,
      total: reservation.total,
      subtotal: reservation.subtotal,
      transportCost: reservation.transport_cost,
      items: reservationItems?.map(item => ({
        productName: item.product_name,
        quantity: item.quantity,
        price: item.product_price,
        extraHours: item.extra_hours,
        itemTotal: item.item_total
      })) || [],
      paymentProofUrl: reservation.payment_proof_url,
      comments: reservation.comments,
      rainReschedule: reservation.rain_reschedule
    };

    return emailData;
  } catch (error) {
    console.error('❌ Error en getReservationEmailData:', error);
    return null;
  }
}

// Función para enviar email cuando se confirma una reserva
export async function sendConfirmationEmailOnReservationUpdate(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener los datos completos de la reserva
    const emailData = await getReservationEmailData(reservationId);
    
    if (!emailData) {
      return { success: false, error: 'No se pudieron obtener los datos de la reserva' };
    }

    // Verificar que tenemos el email del cliente
    if (!emailData.customerEmail) {
      return { success: false, error: 'No se encontró el email del cliente' };
    }

    // Enviar el email de confirmación
    return await sendReservationConfirmationEmail(emailData);
  } catch (error) {
    console.error('❌ Error en sendConfirmationEmailOnReservationUpdate:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Función para enviar notificación de formulario de contacto
export async function sendContactFormEmail(
  contactData: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    mensaje: string;
    contactMessageId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Enviando notificación de formulario de contacto:', contactData.contactMessageId);

    const result = await sendContactNotificationWithLogging(contactData);

    if (!result.success) {
      console.error('❌ Error al enviar notificación de contacto:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Notificación de contacto enviada exitosamente con ID de log:', result.logId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en sendContactFormEmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email' 
    };
  }
}

// Función para obtener logs de email (para administradores)
export async function getEmailLogsForAdmin(
  filters: {
    emailType?: 'reservation_confirmation' | 'reservation_update' | 'contact_form' | 'admin_notification' | 'payment_confirmation';
    status?: 'pending' | 'sent' | 'failed' | 'bounced';
    recipientEmail?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[] | null> {
  try {
    const logs = await getEmailLogs(filters);
    return logs;
  } catch (error) {
    console.error('❌ Error al obtener logs de email:', error);
    return null;
  }
}

// Función para actualizar estado de email (para administradores)
export async function updateEmailLogStatus(
  logId: string,
  status: 'pending' | 'sent' | 'failed' | 'bounced',
  errorMessage?: string
): Promise<boolean> {
  try {
    return await updateEmailStatus(logId, status, errorMessage);
  } catch (error) {
    console.error('❌ Error al actualizar estado de email:', error);
    return false;
  }
} 