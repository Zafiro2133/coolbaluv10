const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReservationHistory() {
  console.log('🧪 Probando función get_reservation_history...\n');

  try {
    // 1. Verificar que la función existe
    console.log('1️⃣ Verificando que la función existe...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'get_reservation_history');

    if (funcError) {
      console.error('❌ Error al verificar función:', funcError);
      return;
    }

    if (functions.length === 0) {
      console.error('❌ La función get_reservation_history no existe');
      return;
    }

    console.log('✅ Función encontrada\n');

    // 2. Obtener una reserva de prueba
    console.log('2️⃣ Obteniendo una reserva de prueba...');
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('id')
      .limit(1);

    if (resError) {
      console.error('❌ Error al obtener reservas:', resError);
      return;
    }

    if (reservations.length === 0) {
      console.log('⚠️ No hay reservas para probar');
      return;
    }

    const testReservationId = reservations[0].id;
    console.log(`✅ Reserva de prueba encontrada: ${testReservationId}\n`);

    // 3. Probar la función con un UUID válido
    console.log('3️⃣ Probando función con UUID válido...');
    const { data: history, error: historyError } = await supabase
      .rpc('get_reservation_history', {
        reservation_id: testReservationId
      });

    if (historyError) {
      console.error('❌ Error al llamar get_reservation_history:', historyError);
      console.log('🔍 Detalles del error:', {
        message: historyError.message,
        details: historyError.details,
        hint: historyError.hint
      });
      return;
    }

    console.log('✅ Función ejecutada correctamente');
    console.log(`📊 Registros encontrados: ${history?.length || 0}`);
    
    if (history && history.length > 0) {
      console.log('📋 Primer registro:', history[0]);
    }

    // 4. Probar con un UUID inválido
    console.log('\n4️⃣ Probando con UUID inválido...');
    const { data: invalidHistory, error: invalidError } = await supabase
      .rpc('get_reservation_history', {
        reservation_id: 'invalid-uuid'
      });

    if (invalidError) {
      console.log('✅ Error esperado con UUID inválido:', invalidError.message);
    } else {
      console.log('⚠️ No se generó error con UUID inválido');
    }

    console.log('\n🎉 Pruebas completadas exitosamente');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar las pruebas
testReservationHistory(); 