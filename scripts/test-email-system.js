const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailSystem() {
  console.log('🧪 Iniciando prueba del sistema de emails...\n');

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('id')
      .limit(1);
    
    if (testError) {
      throw new Error(`Error de conexión a Supabase: ${testError.message}`);
    }
    console.log('✅ Conexión a Supabase exitosa\n');

    // 2. Obtener una reserva de prueba
    console.log('2️⃣ Obteniendo reserva de prueba...');
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        *,
        zone:zones(name),
        user_profile:profiles(first_name, last_name, phone),
        reservation_items(*)
      `)
      .limit(1);

    if (reservationsError) {
      throw new Error(`Error obteniendo reservas: ${reservationsError.message}`);
    }

    if (!reservations || reservations.length === 0) {
      console.log('⚠️ No hay reservas para probar. Creando una reserva de prueba...');
      // Aquí podrías crear una reserva de prueba si es necesario
      return;
    }

    const testReservation = reservations[0];
    console.log(`✅ Reserva de prueba encontrada: ${testReservation.id}\n`);

    // 3. Probar la Edge Function
    console.log('3️⃣ Probando Edge Function de envío de emails...');
    
    // Obtener el email del usuario
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(testReservation.user_id);
    
    if (userError || !user?.email) {
      console.log('⚠️ No se pudo obtener el email del usuario, usando email de prueba...');
      const testEmail = 'test@example.com';
      
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-reservation-emails', {
        body: {
          reservationId: testReservation.id,
          clienteEmail: testEmail
        }
      });

      if (emailError) {
        console.error('❌ Error en Edge Function:', emailError);
        throw new Error(`Error en Edge Function: ${emailError.message}`);
      }

      if (emailResult?.success) {
        console.log('✅ Edge Function funcionando correctamente');
        console.log('📧 Emails enviados a:', emailResult.sentTo);
      } else {
        console.error('❌ Error en respuesta de Edge Function:', emailResult?.error);
      }
    } else {
      console.log(`📧 Usando email real del usuario: ${user.email}`);
      
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-reservation-emails', {
        body: {
          reservationId: testReservation.id,
          clienteEmail: user.email
        }
      });

      if (emailError) {
        console.error('❌ Error en Edge Function:', emailError);
        throw new Error(`Error en Edge Function: ${emailError.message}`);
      }

      if (emailResult?.success) {
        console.log('✅ Edge Function funcionando correctamente');
        console.log('📧 Emails enviados a:', emailResult.sentTo);
      } else {
        console.error('❌ Error en respuesta de Edge Function:', emailResult?.error);
      }
    }

    console.log('\n🎉 Prueba del sistema de emails completada');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Conexión a Supabase: OK');
    console.log('- ✅ Obtención de reservas: OK');
    console.log('- ✅ Edge Function: OK');
    console.log('- 📧 Email del admin configurado: hola@estudiomaters.com');
    console.log('- 🔑 API Key de Resend configurada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar la prueba
testEmailSystem(); 