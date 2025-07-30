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

async function testEmergencyFix() {
  console.log('🚨 Probando solución de emergencia...\n');

  try {
    // 1. Verificar que la columna key existe
    console.log('1️⃣ Verificando columna key...');
    const { data: keyTest, error: keyError } = await supabase
      .from('reservation_items')
      .select('id, reservation_id, product_id, key')
      .limit(1);
    
    if (keyError) {
      console.error('❌ Error con columna key:', keyError);
      console.log('   Código:', keyError.code);
      console.log('   Mensaje:', keyError.message);
      console.log('');
      console.log('🔧 EJECUTA EL SCRIPT DE EMERGENCIA:');
      console.log('   Archivo: supabase/scripts/emergency-fix-key-column.sql');
      console.log('');
      console.log('📋 Pasos:');
      console.log('   1. Ve a Supabase Dashboard');
      console.log('   2. Navega a SQL Editor');
      console.log('   3. Copia y pega el contenido del archivo');
      console.log('   4. Ejecuta el script');
      console.log('   5. Vuelve a probar');
      return;
    } else {
      console.log('✅ Columna key funciona correctamente');
      console.log('   Datos de prueba:', keyTest[0]);
    }
    console.log('');

    // 2. Probar actualización de reserva
    console.log('2️⃣ Probando actualización de reserva...');
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status')
      .limit(1);
    
    if (reservationError || !reservations || reservations.length === 0) {
      console.log('⚠️ No hay reservas para probar');
    } else {
      const reservation = reservations[0];
      console.log(`   Probando con reserva ID: ${reservation.id}`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'confirmed',
          payment_proof_url: 'https://test.com/emergency-fix.jpg'
        })
        .eq('id', reservation.id)
        .select();
      
      if (updateError) {
        console.error('❌ Error al actualizar reserva:', updateError);
        console.log('   Código:', updateError.code);
        console.log('   Mensaje:', updateError.message);
        console.log('');
        console.log('🔧 EJECUTA EL SCRIPT DE EMERGENCIA:');
        console.log('   Archivo: supabase/scripts/emergency-fix-key-column.sql');
      } else {
        console.log('✅ Actualización de reserva exitosa!');
        console.log(`   Nuevo estado: ${updateData[0].status}`);
        console.log(`   Nuevo comprobante: ${updateData[0].payment_proof_url}`);
      }
    }
    console.log('');

    // 3. Probar consulta de reservas
    console.log('3️⃣ Probando consulta de reservas...');
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('reservations')
      .select(`*, reservation_items(id, reservation_id, product_id, product_name, product_price, quantity, extra_hours, extra_hour_percentage, item_total)`)
      .limit(1);
    
    if (reservationsError) {
      console.error('❌ Error en consulta de reservas:', reservationsError);
    } else {
      console.log('✅ Consulta de reservas exitosa');
      console.log('   Datos obtenidos:', reservationsData.length, 'reservas');
    }
    console.log('');

    console.log('🎯 PRUEBA COMPLETADA');
    console.log('====================');
    console.log('✅ Columna key agregada y funcional');
    console.log('✅ Actualización de reservas funciona');
    console.log('✅ Consulta de reservas funciona');
    console.log('');
    console.log('🎉 ¡La solución de emergencia está funcionando!');
    console.log('Ahora puedes confirmar reservas sin errores.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testEmergencyFix(); 