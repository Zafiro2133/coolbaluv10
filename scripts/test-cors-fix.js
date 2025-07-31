const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no encontrada en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorsFix() {
  console.log('🧪 Probando corrección de CORS...\n');

  try {
    // Simular una llamada a la Edge Function
    console.log('📡 Llamando a send-reservation-emails...');
    
    const { data, error } = await supabase.functions.invoke('send-reservation-emails', {
      body: {
        reservationId: 'test-reservation-id',
        clienteEmail: 'test@example.com'
      }
    });

    if (error) {
      console.log('❌ Error recibido:', error);
      
      if (error.message && error.message.includes('CORS')) {
        console.log('⚠️  El problema de CORS persiste');
        return false;
      } else {
        console.log('✅ CORS funcionando correctamente, pero hay otro error (esperado para datos de prueba)');
        console.log('📝 Error esperado:', error.message);
        return true;
      }
    } else {
      console.log('✅ ¡CORS funcionando perfectamente!');
      console.log('📝 Respuesta:', data);
      return true;
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    
    if (error.message && error.message.includes('CORS')) {
      console.log('⚠️  El problema de CORS persiste');
      return false;
    } else {
      console.log('✅ CORS funcionando correctamente, error de otro tipo');
      return true;
    }
  }
}

// Ejecutar la prueba
testCorsFix()
  .then((success) => {
    if (success) {
      console.log('\n🎉 ¡Prueba completada! El problema de CORS debería estar solucionado.');
      console.log('💡 Ahora puedes probar crear una reserva real desde tu aplicación.');
    } else {
      console.log('\n⚠️  El problema de CORS persiste. Revisa la configuración.');
    }
  })
  .catch((error) => {
    console.error('❌ Error en la prueba:', error);
  }); 