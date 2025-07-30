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

async function testReservationUpdate() {
  console.log('🔍 Probando actualización de reserva...\n');

  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión...');
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError);
      return;
    }
    console.log('✅ Conexión exitosa\n');

    // 2. Obtener una reserva de prueba
    console.log('2️⃣ Obteniendo reserva de prueba...');
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status, payment_proof_url, user_id')
      .limit(1);
    
    if (reservationError) {
      console.error('❌ Error obteniendo reservas:', reservationError);
      return;
    }
    
    if (!reservations || reservations.length === 0) {
      console.log('⚠️ No hay reservas para probar');
      return;
    }
    
    const reservation = reservations[0];
    console.log(`✅ Reserva encontrada: ID ${reservation.id}`);
    console.log(`   Estado actual: ${reservation.status}`);
    console.log(`   Comprobante actual: ${reservation.payment_proof_url || 'ninguno'}`);
    console.log(`   User ID: ${reservation.user_id}\n`);

    // 3. Probar actualización sin contexto de admin
    console.log('3️⃣ Probando actualización sin contexto de admin...');
    const { data: updateData1, error: updateError1 } = await supabase
      .from('reservations')
      .update({ 
        status: 'confirmed',
        payment_proof_url: 'https://test.com/proof.jpg'
      })
      .eq('id', reservation.id)
      .select();
    
    if (updateError1) {
      console.error('❌ Error sin contexto admin:', updateError1);
      console.log('   Código:', updateError1.code);
      console.log('   Mensaje:', updateError1.message);
      console.log('   Detalles:', updateError1.details);
      console.log('   Sugerencia:', updateError1.hint);
    } else {
      console.log('✅ Actualización exitosa sin contexto admin');
      console.log(`   Nuevo estado: ${updateData1[0].status}`);
      console.log(`   Nuevo comprobante: ${updateData1[0].payment_proof_url}`);
    }
    console.log('');

    // 4. Probar con contexto de admin
    console.log('4️⃣ Probando con contexto de admin...');
    try {
      const { error: contextError } = await supabase.rpc('set_admin_context', {
        user_id: reservation.user_id,
        user_email: 'admin@test.com'
      });
      
      if (contextError) {
        console.error('❌ Error estableciendo contexto admin:', contextError);
      } else {
        console.log('✅ Contexto admin establecido');
        
        // Intentar actualización con contexto admin
        const { data: updateData2, error: updateError2 } = await supabase
          .from('reservations')
          .update({ 
            status: 'confirmed',
            payment_proof_url: 'https://test.com/proof2.jpg'
          })
          .eq('id', reservation.id)
          .select();
        
        if (updateError2) {
          console.error('❌ Error con contexto admin:', updateError2);
          console.log('   Código:', updateError2.code);
          console.log('   Mensaje:', updateError2.message);
          console.log('   Detalles:', updateError2.details);
          console.log('   Sugerencia:', updateError2.hint);
        } else {
          console.log('✅ Actualización exitosa con contexto admin');
          console.log(`   Nuevo estado: ${updateData2[0].status}`);
          console.log(`   Nuevo comprobante: ${updateData2[0].payment_proof_url}`);
        }
      }
    } catch (contextError) {
      console.error('❌ Error general con contexto admin:', contextError);
    }
    console.log('');

    // 5. Verificar políticas
    console.log('5️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'reservations');
    
    if (policiesError) {
      console.log('⚠️ No se pudieron obtener políticas automáticamente');
      console.log('   Error:', policiesError.message);
    } else {
      console.log(`✅ Políticas encontradas: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }
    console.log('');

    console.log('🎯 Prueba completada. Revisa los errores arriba para identificar el problema.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testReservationUpdate(); 