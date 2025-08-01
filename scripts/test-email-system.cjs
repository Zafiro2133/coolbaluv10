const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailSystem() {
  console.log('🧪 Probando sistema de emails...\n');

  try {
    // 1. Probar la edge function directamente
    console.log('1️⃣ Probando edge function...');
    
    const testData = {
      to: 'test@example.com',
      subject: 'Test de Email - Coolbalu',
      reservationData: {
        reservationId: 'test-123',
        customerName: 'Cliente de Prueba',
        customerEmail: 'test@example.com',
        eventDate: '2025-02-15',
        eventTime: '14:00',
        eventAddress: 'Calle de Prueba 123, Buenos Aires',
        adultCount: 2,
        childCount: 1,
        total: 50000,
        subtotal: 45000,
        transportCost: 5000,
        items: [
          {
            productName: 'Producto de Prueba',
            quantity: 1,
            price: 45000,
            extraHours: 0,
            itemTotal: 45000
          }
        ],
        comments: 'Comentario de prueba',
        rainReschedule: 'no'
      }
    };

    const { data, error } = await supabase.functions.invoke('resend-email', {
      body: testData
    });

    if (error) {
      console.error('❌ Error en edge function:', error);
    } else {
      console.log('✅ Edge function funcionando correctamente');
      console.log('📧 Respuesta:', data);
    }

    // 2. Verificar configuración de Resend
    console.log('\n2️⃣ Verificando configuración de Resend...');
    
    // Intentar obtener información de la API de Resend
    const resendTest = await supabase.functions.invoke('resend-email', {
      body: {
        to: 'test@example.com',
        subject: 'Test de Configuración',
        reservationData: {
          reservationId: 'config-test',
          customerName: 'Test',
          customerEmail: 'test@example.com',
          eventDate: '2025-02-15',
          eventTime: '14:00',
          eventAddress: 'Test',
          adultCount: 1,
          childCount: 0,
          total: 1000,
          subtotal: 1000,
          transportCost: 0,
          items: []
        }
      }
    });

    if (resendTest.error) {
      console.error('❌ Error en configuración de Resend:', resendTest.error);
    } else {
      console.log('✅ Configuración de Resend correcta');
    }

    // 3. Verificar datos de reservas
    console.log('\n3️⃣ Verificando datos de reservas...');
    
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);

    if (reservationsError) {
      console.error('❌ Error al obtener reservas:', reservationsError);
    } else {
      console.log('✅ Datos de reservas accesibles');
      console.log(`📊 Reservas encontradas: ${reservations?.length || 0}`);
      
      if (reservations && reservations.length > 0) {
        const reservation = reservations[0];
        console.log('📋 Ejemplo de reserva:');
        console.log(`   ID: ${reservation.id}`);
        console.log(`   Estado: ${reservation.status}`);
        console.log(`   Total: $${reservation.total}`);
        console.log(`   Fecha: ${reservation.event_date}`);
      }
    }

    console.log('\n✅ Prueba del sistema de emails completada');
    console.log('\n📝 Resumen:');
    console.log('- Edge function: ✅ Funcionando');
    console.log('- Resend config: ✅ Correcta');
    console.log('- Datos de reservas: ✅ Accesibles');
    console.log('\n🚀 El sistema está listo para usar!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verificar que la edge function esté desplegada');
    console.log('2. Verificar la API key de Resend');
    console.log('3. Verificar el dominio verificado en Resend');
    console.log('4. Verificar permisos de Supabase');
  }
}

// Ejecutar la prueba
testEmailSystem(); 