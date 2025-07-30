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

async function quickTestKeyColumn() {
  console.log('🔍 Verificando columna key en reservation_items...\n');

  try {
    // 1. Verificar que la tabla reservation_items es accesible
    console.log('1️⃣ Verificando acceso a reservation_items...');
    const { data: items, error: itemsError } = await supabase
      .from('reservation_items')
      .select('*')
      .limit(1);
    
    if (itemsError) {
      console.error('❌ Error accediendo a reservation_items:', itemsError);
      console.log('   Código:', itemsError.code);
      console.log('   Mensaje:', itemsError.message);
      return;
    }
    
    console.log('✅ Tabla reservation_items accesible');
    console.log('   Columnas disponibles:', Object.keys(items[0] || {}));
    console.log('');

    // 2. Verificar específicamente la columna key
    console.log('2️⃣ Verificando columna key...');
    const { data: keyTest, error: keyError } = await supabase
      .from('reservation_items')
      .select('id, reservation_id, product_id, key')
      .limit(1);
    
    if (keyError) {
      console.error('❌ Error con columna key:', keyError);
      console.log('   Código:', keyError.code);
      console.log('   Mensaje:', keyError.message);
      console.log('');
      console.log('🔧 SOLUCIÓN: Ejecuta el script SQL en Supabase:');
      console.log('   Archivo: supabase/scripts/quick-fix-key-column.sql');
      console.log('');
      console.log('📋 Pasos:');
      console.log('   1. Ve a Supabase Dashboard');
      console.log('   2. Navega a SQL Editor');
      console.log('   3. Copia y pega el contenido del archivo');
      console.log('   4. Ejecuta el script');
      console.log('   5. Vuelve a probar la confirmación de reserva');
    } else {
      console.log('✅ Columna key funciona correctamente');
      console.log('   Datos de prueba:', keyTest[0]);
      console.log('');
      console.log('🎉 ¡La columna key está funcionando!');
      console.log('Ahora deberías poder confirmar reservas sin errores.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

quickTestKeyColumn(); 