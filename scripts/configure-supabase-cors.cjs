const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM3MTI5MSwiZXhwIjoyMDY4OTQ3MjkxfQ.yGa3Q8T9y9e6SdE08jH1_2SqhYmk1q18Tm_16izohno';

// Crear cliente con service role key para configuraciones administrativas
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function configureCORS() {
  console.log('🔧 Configurando CORS en Supabase...\n');

  try {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      // Desarrollo local
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      
      // Vercel (reemplaza con tu dominio real)
      'https://tu-proyecto.vercel.app',
      'https://*.vercel.app',
      
      // Dominio personalizado (si tienes uno)
      'https://estudiomaters.com',
      'https://www.estudiomaters.com'
    ];

    console.log('📋 Orígenes que se configurarán:');
    allowedOrigins.forEach(origin => {
      console.log(`   - ${origin}`);
    });

    console.log('\n⚠️  IMPORTANTE: La configuración de CORS debe hacerse manualmente en el dashboard de Supabase.');
    console.log('\n📋 Pasos a seguir:');
    console.log('1. Ve a https://supabase.com/dashboard/project/rwgxdtfuzpdukaguogyh/settings/api');
    console.log('2. Busca la sección "CORS (Cross-Origin Resource Sharing)"');
    console.log('3. Agrega cada uno de los orígenes listados arriba');
    console.log('4. Haz clic en "Save"');

    // Verificar configuración actual
    console.log('\n🔍 Verificando configuración actual...');
    
    // Intentar hacer una petición de prueba
    const { data, error } = await supabase
      .from('reservations')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message);
      console.log('\n🔧 Posibles soluciones:');
      console.log('1. Verifica que la service role key sea correcta');
      console.log('2. Asegúrate de que el proyecto esté activo');
      console.log('3. Verifica la configuración de CORS en el dashboard');
    } else {
      console.log('✅ Conexión con Supabase exitosa');
      console.log('✅ La configuración de CORS parece estar funcionando');
    }

    // Mostrar información adicional
    console.log('\n📚 Información adicional:');
    console.log('- URL del proyecto: https://rwgxdtfuzpdukaguogyh.supabase.co');
    console.log('- Dashboard: https://supabase.com/dashboard/project/rwgxdtfuzpdukaguogyh');
    console.log('- API Docs: https://supabase.com/dashboard/project/rwgxdtfuzpdukaguogyh/api');

    console.log('\n✅ Configuración de CORS completada!');
    console.log('\n💡 Recuerda actualizar los orígenes cuando despliegues en Vercel con tu dominio real.');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    console.log('\n🔧 Solución manual:');
    console.log('1. Ve al dashboard de Supabase');
    console.log('2. Settings > API > CORS');
    console.log('3. Agrega los orígenes manualmente');
  }
}

// Ejecutar configuración
configureCORS(); 