// Script para probar la aplicación web
import { createClient } from '@supabase/supabase-js';

console.log('🌐 Probando aplicación web...');

// Simular el entorno de la aplicación web
const webConfig = {
  url: 'https://rwgxdtfuzpdukaguogyh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0'
};

async function testWebApp() {
  try {
    console.log('🔧 Inicializando cliente Supabase para web...');
    
    const supabase = createClient(webConfig.url, webConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    });
    
    console.log('✅ Cliente inicializado');
    
    // Probar consulta simple
    console.log('🔍 Probando consulta simple...');
    const { data: countData, error: countError } = await supabase
      .from('reservation_items')
      .select('count')
      .limit(1);
    
    if (countError) {
      console.log('❌ Error en consulta:', countError.message);
      return;
    }
    
    console.log('✅ Consulta exitosa:', countData);
    
    // Probar inserción (debería fallar por RLS, pero no por API key)
    console.log('🧪 Probando inserción (debería fallar por RLS)...');
    const testData = {
      reservation_id: '00000000-0000-0000-0000-000000000000',
      product_id: '00000000-0000-0000-0000-000000000001',
      product_name: 'Test Product',
      product_price: 100.00,
      quantity: 1,
      extra_hours: 0,
      extra_hour_percentage: 0,
      item_total: 100.00,
      key: 'test-key-value'
    };
    
    const { error: insertError } = await supabase
      .from('reservation_items')
      .insert(testData);
    
    if (insertError) {
      if (insertError.message.includes('No API key found')) {
        console.log('❌ PROBLEMA: API key no encontrada en la petición');
        console.log('💡 Esto indica un problema de configuración');
      } else if (insertError.message.includes('row-level security')) {
        console.log('✅ Inserción falló por RLS (esperado)');
        console.log('✅ API key funciona correctamente');
      } else {
        console.log('⚠️ Error inesperado:', insertError.message);
      }
    } else {
      console.log('✅ Inserción exitosa (inesperado)');
    }
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

testWebApp().then(() => {
  console.log('\n🏁 Prueba de aplicación web completada');
  console.log('💡 Si ves "API key no encontrada", verifica:');
  console.log('   1. Que el archivo .env esté en la raíz del proyecto');
  console.log('   2. Que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén definidas');
  console.log('   3. Que la aplicación se haya reiniciado después de crear el .env');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 