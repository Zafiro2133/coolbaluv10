// Script para verificar que la columna key existe y funciona
// Proyecto: rwgxdtfuzpdukaguogyh

import { createClient } from '@supabase/supabase-js';

// Configuración del proyecto - claves directamente
const SUPABASE_URL = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyKeyColumn() {
  console.log('🔍 Verificando columna key en reservation_items...');
  
  try {
    // Verificar que la columna existe usando SQL directo
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'reservation_items' })
      .select('*');
    
    if (error) {
      console.log('⚠️ No se pudo usar RPC, intentando consulta directa...');
      
      // Consulta alternativa usando SQL directo
      const { data: tableInfo, error: tableError } = await supabase
        .from('reservation_items')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Error accediendo a la tabla:', tableError);
        return;
      }
      
      console.log('✅ Tabla reservation_items accesible');
      console.log('📊 Estructura de la tabla (primer registro):', Object.keys(tableInfo[0] || {}));
      
      // Verificar específicamente la columna key
      if (tableInfo[0] && 'key' in tableInfo[0]) {
        console.log('✅ Columna "key" encontrada correctamente!');
      } else {
        console.log('❌ Columna "key" NO encontrada');
        console.log('💡 Necesitas ejecutar el SQL para agregarla');
      }
    } else {
      console.log('📊 Columnas encontradas en reservation_items:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Verificar específicamente la columna key
      const keyColumn = columns.find(col => col.column_name === 'key');
      if (keyColumn) {
        console.log('✅ Columna "key" encontrada correctamente!');
        console.log(`   Tipo: ${keyColumn.data_type}, Nullable: ${keyColumn.is_nullable}`);
      } else {
        console.log('❌ Columna "key" NO encontrada');
        console.log('💡 Necesitas ejecutar el SQL para agregarla');
      }
    }
    
    // Probar inserción con key
    console.log('🧪 Probando inserción con columna key...');
    const testData = {
      reservation_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
      product_id: '00000000-0000-0000-0000-000000000001', // UUID de prueba
      product_name: 'Test Product',
      product_price: 100.00,
      quantity: 1,
      extra_hours: 0,
      extra_hour_percentage: 0,
      item_total: 100.00,
      key: 'test-key-value' // Incluir la columna key
    };
    
    const { error: insertError } = await supabase
      .from('reservation_items')
      .insert(testData);
    
    if (insertError) {
      console.log('❌ Error en inserción de prueba:', insertError.message);
      if (insertError.message.includes('column "key" does not exist')) {
        console.log('💡 La columna key aún no existe. Ejecuta el SQL para agregarla.');
      }
    } else {
      console.log('✅ Inserción de prueba exitosa con columna key!');
      
      // Limpiar datos de prueba
      const { error: deleteError } = await supabase
        .from('reservation_items')
        .delete()
        .eq('reservation_id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.log('⚠️ Error limpiando datos de prueba:', deleteError.message);
      } else {
        console.log('🧹 Datos de prueba limpiados correctamente');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la verificación
verifyKeyColumn().then(() => {
  console.log('🏁 Verificación completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 