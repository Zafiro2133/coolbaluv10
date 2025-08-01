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

async function testEmailSending() {
  console.log('🧪 Probando envío de emails\n');

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

    // 2. Obtener datos del usuario
    console.log('\n2. Obteniendo datos del usuario...');
    const { data: userEmail, error: userError } = await supabase.rpc('get_user_email', {
      user_id_param: recentReservation.user_id
    });

    if (userError) {
      console.error('❌ Error al obtener email del usuario:', userError);
      return;
    }

    console.log('✅ Email del usuario:', userEmail);

    // 3. Obtener datos completos de la reserva (sin foreign key)
    console.log('\n3. Obteniendo datos completos de la reserva...');
    
    // Obtener items de la reserva
    const { data: reservationItems, error: itemsError } = await supabase
      .from('reservation_items')
      .select('*')
      .eq('reservation_id', recentReservation.id);

    if (itemsError) {
      console.error('❌ Error al obtener items de la reserva:', itemsError);
      return;
    }

    // Obtener perfil del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', recentReservation.user_id)
      .single();

    if (profileError) {
      console.warn('⚠️ No se pudo obtener el perfil del usuario:', profileError);
    }

    console.log('✅ Datos de la reserva obtenidos:', {
      customerName: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Cliente',
      items: reservationItems?.length || 0,
      total: recentReservation.total
    });

    // 4. Probar envío de email usando Resend directamente
    console.log('\n4. Probando envío de email con Resend...');
    const resendApiKey = process.env.RESEND_API_KEY || 're_joWXR676_MZuHU9v6sMYBdZBMXB129XrF';
    
    const customerName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Cliente';
    
    const emailData = {
      from: 'hola@estudiomaters.com',
      to: userEmail,
      subject: 'Prueba de confirmación - Coolbalu',
      html: `
        <h1>¡Hola ${customerName}!</h1>
        <p>Esta es una prueba del sistema de emails de Coolbalu.</p>
        <p>Tu reserva ID: ${recentReservation.id}</p>
        <p>Fecha del evento: ${recentReservation.event_date}</p>
        <p>Total: $${recentReservation.total}</p>
        <p>Si recibes este email, el sistema está funcionando correctamente.</p>
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email de prueba enviado exitosamente');
      console.log(`   Email ID: ${result.id}`);
      
      // 5. Registrar el email en los logs
      console.log('\n5. Registrando email en logs...');
      const { data: logId, error: logError } = await supabase.rpc('log_email_sent', {
        email_type_param: 'reservation_confirmation',
        recipient_email_param: userEmail,
        recipient_name_param: customerName,
        subject_param: emailData.subject,
        content_param: emailData.html,
        metadata_param: { test: true, resend_id: result.id },
        related_reservation_id_param: recentReservation.id,
        related_contact_message_id_param: null
      });

      if (logError) {
        console.error('❌ Error al registrar email en logs:', logError);
      } else {
        console.log('✅ Email registrado en logs con ID:', logId);
      }
    } else {
      const errorData = await response.json();
      console.error('❌ Error al enviar email de prueba:', errorData);
    }

    console.log('\n📋 Resumen de la prueba:');
    console.log('Si recibiste el email de prueba, el sistema está funcionando.');
    console.log('Si no lo recibiste, verifica:');
    console.log('1. Que el email no esté en spam');
    console.log('2. Que el dominio estudiomaters.com esté verificado en Resend');
    console.log('3. Que la API key de Resend sea válida');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba
testEmailSending().then(() => {
  console.log('\n✅ Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 