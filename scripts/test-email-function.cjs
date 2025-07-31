const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailFunction() {
  console.log('🧪 Probando Edge Function de correos...');
  
  try {
    // Obtener una reserva reciente para probar
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (reservationsError) {
      console.error('❌ Error obteniendo reservas:', reservationsError);
      return;
    }

    if (!reservations || reservations.length === 0) {
      console.log('⚠️ No hay reservas para probar');
      return;
    }

    const reservationId = reservations[0].id;
    console.log('📋 Usando reserva ID:', reservationId);

    // Probar la Edge Function
    const { data, error } = await supabase.functions.invoke('send-reservation-emails', {
      body: {
        reservationId: reservationId,
        clienteEmail: 'test@example.com'
      }
    });

    if (error) {
      console.error('❌ Error en Edge Function:', error);
      console.log('🔍 Detalles del error:', {
        message: error.message,
        status: error.status,
        details: error.details
      });
    } else {
      console.log('✅ Respuesta de Edge Function:', data);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testEmailFunction(); 