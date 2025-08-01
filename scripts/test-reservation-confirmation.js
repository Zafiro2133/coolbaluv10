import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no está configurado en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para obtener datos completos de la reserva para el email
async function getReservationEmailData(reservationId) {
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
    const emailData = {
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

// Función para enviar email usando Resend
async function sendReservationConfirmationEmail(reservationData) {
  try {
    console.log('📧 Enviando email de confirmación para reserva:', reservationData.reservationId);

    const resendApiKey = process.env.RESEND_API_KEY || 're_joWXR676_MZuHU9v6sMYBdZBMXB129XrF';
    
    // Preparar el contenido del email
    const emailContent = `
      <h1>¡Hola ${reservationData.customerName}!</h1>
      <p>Tu reserva en <strong>Coolbalu</strong> ha sido confirmada.</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>Detalles de tu reserva:</h2>
        <p><strong>ID de Reserva:</strong> ${reservationData.reservationId}</p>
        <p><strong>Fecha:</strong> ${reservationData.eventDate}</p>
        <p><strong>Hora:</strong> ${reservationData.eventTime}</p>
        <p><strong>Dirección:</strong> ${reservationData.eventAddress}</p>
        <p><strong>Total:</strong> $${reservationData.total}</p>
      </div>
      
      <p>¡Nos vemos en tu evento!</p>
    `;

    const emailData = {
      from: 'hola@estudiomaters.com',
      to: reservationData.customerEmail,
      subject: 'Tu reserva en Coolbalu ha sido confirmada',
      html: emailContent
    };

    // Enviar email usando Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error al enviar email con Resend:', errorData);
      return { success: false, error: errorData.message };
    }

    const result = await response.json();
    console.log('✅ Email enviado exitosamente:', result.id);

    // Registrar email en logs
    const { data: logId, error: logError } = await supabase.rpc('log_email_sent', {
      email_type_param: 'reservation_confirmation',
      recipient_email_param: reservationData.customerEmail,
      recipient_name_param: reservationData.customerName,
      subject_param: emailData.subject,
      content_param: emailContent,
      metadata_param: { resend_id: result.id },
      related_reservation_id_param: reservationData.reservationId,
      related_contact_message_id_param: null
    });

    if (logError) {
      console.warn('⚠️ Error al registrar email en logs:', logError);
    } else {
      console.log('✅ Email registrado en logs con ID:', logId);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error en sendReservationConfirmationEmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email' 
    };
  }
}

async function testReservationConfirmation() {
  console.log('🧪 Probando flujo completo de confirmación de reserva\n');

  try {
    // 1. Obtener una reserva confirmada reciente
    console.log('1. Buscando reserva confirmada reciente...');
    const { data: recentReservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (reservationError || !recentReservation) {
      console.error('❌ No se encontró una reserva confirmada para probar');
      return;
    }

    console.log('✅ Reserva encontrada:', {
      id: recentReservation.id,
      status: recentReservation.status,
      user_id: recentReservation.user_id,
      event_date: recentReservation.event_date
    });

    // 2. Simular el proceso de confirmación (como lo hace el admin)
    console.log('\n2. Simulando proceso de confirmación...');
    
    // Establecer contexto de admin
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        await supabase.rpc('set_admin_context', {
          admin_user_id: user.id,
          admin_user_email: user.email || ''
        });
        console.log('✅ Contexto de admin establecido');
      } catch (error) {
        console.warn('⚠️ Error estableciendo contexto de admin:', error);
      }
    }

    // 3. Probar la función getReservationEmailData
    console.log('\n3. Probando función getReservationEmailData...');
    
    const emailData = await getReservationEmailData(recentReservation.id);
    
    if (!emailData) {
      console.error('❌ No se pudieron obtener los datos de email de la reserva');
      return;
    }

    console.log('✅ Datos de email obtenidos:', {
      customerName: emailData.customerName,
      customerEmail: emailData.customerEmail,
      items: emailData.items.length,
      total: emailData.total
    });

    // 4. Probar envío de email usando la función real
    console.log('\n4. Probando envío de email con función real...');
    
    const emailResult = await sendReservationConfirmationEmail(emailData);
    
    if (emailResult.success) {
      console.log('✅ Email enviado exitosamente usando función real');
    } else {
      console.error('❌ Error al enviar email:', emailResult.error);
    }

    // 5. Verificar logs de email
    console.log('\n5. Verificando logs de email...');
    const { data: emailLogs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('related_reservation_id', recentReservation.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('❌ Error al obtener logs de email:', logsError);
    } else if (!emailLogs || emailLogs.length === 0) {
      console.log('ℹ️ No se encontraron logs de email para esta reserva');
    } else {
      console.log('✅ Logs de email encontrados:');
      emailLogs.forEach(log => {
        console.log(`   - ${log.email_type} -> ${log.recipient_email} (${log.status})`);
        if (log.error_message) {
          console.log(`     Error: ${log.error_message}`);
        }
      });
    }

    console.log('\n📋 Resumen de la prueba:');
    console.log('Si todo funcionó correctamente, el sistema de emails está operativo.');
    console.log('Ahora puedes probar confirmando una reserva desde el panel de administración.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba
testReservationConfirmation().then(() => {
  console.log('\n✅ Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 