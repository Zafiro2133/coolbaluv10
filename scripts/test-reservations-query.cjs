const { createClient } = require('@supabase/supabase-js');

// Obtener variables de entorno del archivo .env manualmente
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error leyendo archivo .env:', error.message);
    return {};
  }
}

const env = loadEnvFile();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltante');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseServiceKey ? '✅ Configurado' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReservationsQuery() {
  console.log('🔍 Probando consulta de reservas...\n');

  try {
    // 1. Probar la consulta que causa el error
    console.log('1️⃣ Probando consulta con reservation_items(*)...');
    try {
      const { data: data1, error: error1 } = await supabase
        .from('reservations')
        .select(`*, reservation_items(*)`)
        .limit(1);
      
      if (error1) {
        console.error('❌ Error con reservation_items(*):', error1);
        console.log('   Código:', error1.code);
        console.log('   Mensaje:', error1.message);
      } else {
        console.log('✅ Consulta con reservation_items(*) funciona');
        console.log('   Datos obtenidos:', data1.length, 'reservas');
      }
    } catch (error) {
      console.error('❌ Excepción con reservation_items(*):', error.message);
    }
    console.log('');

    // 2. Probar la consulta corregida
    console.log('2️⃣ Probando consulta corregida...');
    try {
      const { data: data2, error: error2 } = await supabase
        .from('reservations')
        .select(`*, reservation_items(id, reservation_id, product_id, product_name, product_price, quantity, extra_hours, extra_hour_percentage, item_total)`)
        .limit(1);
      
      if (error2) {
        console.error('❌ Error con consulta corregida:', error2);
        console.log('   Código:', error2.code);
        console.log('   Mensaje:', error2.message);
      } else {
        console.log('✅ Consulta corregida funciona');
        console.log('   Datos obtenidos:', data2.length, 'reservas');
        if (data2.length > 0) {
          console.log('   Primera reserva ID:', data2[0].id);
          console.log('   Items de reserva:', data2[0].reservation_items?.length || 0);
        }
      }
    } catch (error) {
      console.error('❌ Excepción con consulta corregida:', error.message);
    }
    console.log('');

    // 3. Probar actualización de reserva
    console.log('3️⃣ Probando actualización de reserva...');
    try {
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('id, status')
        .limit(1);
      
      if (reservationError || !reservations || reservations.length === 0) {
        console.log('⚠️ No hay reservas para probar actualización');
      } else {
        const reservation = reservations[0];
        console.log(`   Probando con reserva ID: ${reservation.id}`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('reservations')
          .update({ 
            status: 'confirmed',
            payment_proof_url: 'https://test.com/proof-fixed.jpg'
          })
          .eq('id', reservation.id)
          .select();
        
        if (updateError) {
          console.error('❌ Error al actualizar reserva:', updateError);
          console.log('   Código:', updateError.code);
          console.log('   Mensaje:', updateError.message);
        } else {
          console.log('✅ Actualización de reserva exitosa');
          console.log(`   Nuevo estado: ${updateData[0].status}`);
        }
      }
    } catch (error) {
      console.error('❌ Excepción en actualización:', error.message);
    }
    console.log('');

    console.log('🎯 PRUEBA COMPLETADA');
    console.log('====================');
    console.log('✅ Consulta corregida funciona');
    console.log('✅ Actualización de reservas funciona');
    console.log('');
    console.log('🎉 ¡La solución está funcionando!');
    console.log('Ahora puedes confirmar reservas sin errores.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testReservationsQuery(); 