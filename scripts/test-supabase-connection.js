// Script para probar la conexión con Supabase
// Usando la configuración centralizada

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

console.log('🔧 Probando conexión con Supabase...');
console.log('📊 Configuración del proyecto:');
console.log(`   Project ID: ${SUPABASE_CONFIG.PROJECT_ID}`);
console.log(`   Project Name: ${SUPABASE_CONFIG.PROJECT_NAME}`);
console.log(`   URL: ${SUPABASE_CONFIG.SUPABASE_URL}`);

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_CONFIG.SUPABASE_URL, SUPABASE_CONFIG.ANON_PUBLIC_KEY);

async function testConnection() {
  try {
    console.log('🔍 Probando conexión...');
    
    // Probar una consulta simple
    const { data, error } = await supabase
      .from('reservation_items')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Error en la conexión:', error.message);
      return;
    }
    
    console.log('✅ Conexión exitosa con Supabase!');
    console.log('📊 Datos de prueba recibidos:', data);
    
    // Probar inserción con columna key
    console.log('🧪 Probando inserción con columna key...');
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
      if (insertError.message.includes('column "key" does not exist')) {
        console.log('❌ La columna "key" aún no existe');
        console.log('💡 Necesitas ejecutar el SQL para agregarla');
        console.log('📝 SQL a ejecutar:');
        console.log(`
ALTER TABLE public.reservation_items 
ADD COLUMN IF NOT EXISTS "key" TEXT;
        `);
      } else {
        console.log('❌ Error en inserción:', insertError.message);
      }
    } else {
      console.log('✅ Inserción exitosa con columna key!');
      
      // Limpiar datos de prueba
      const { error: deleteError } = await supabase
        .from('reservation_items')
        .delete()
        .eq('reservation_id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.log('⚠️ Error limpiando datos:', deleteError.message);
      } else {
        console.log('🧹 Datos de prueba limpiados');
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar la prueba
testConnection().then(() => {
  console.log('🏁 Prueba completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 