const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('💡 Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReservationsKeyColumn() {
  console.log('🔍 Verificando columna "key" en tabla reservations...');
  
  try {
    // Verificar que la columna existe usando SQL directo
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'reservations' })
      .select('*');
    
    if (error) {
      console.log('⚠️ No se pudo usar RPC, intentando consulta directa...');
      
      // Consulta alternativa usando SQL directo
      const { data: tableInfo, error: tableError } = await supabase
        .from('reservations')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Error accediendo a la tabla:', tableError);
        return;
      }
      
      console.log('✅ Tabla reservations accesible');
      console.log('📊 Estructura de la tabla (primer registro):', Object.keys(tableInfo[0] || {}));
      
      // Verificar específicamente la columna key
      if (tableInfo[0] && 'key' in tableInfo[0]) {
        console.log('✅ Columna "key" encontrada correctamente en reservations!');
      } else {
        console.log('❌ Columna "key" NO encontrada en reservations');
        console.log('💡 Necesitas ejecutar el SQL para agregarla');
      }
    } else {
      console.log('📊 Columnas encontradas en reservations:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Verificar específicamente la columna key
      const keyColumn = columns.find(col => col.column_name === 'key');
      if (keyColumn) {
        console.log('✅ Columna "key" encontrada correctamente en reservations!');
        console.log(`   Tipo: ${keyColumn.data_type}, Nullable: ${keyColumn.is_nullable}`);
      } else {
        console.log('❌ Columna "key" NO encontrada en reservations');
        console.log('💡 Necesitas ejecutar el SQL para agregarla');
      }
    }
    
    // Probar inserción con key
    console.log('🧪 Probando inserción con columna key en reservations...');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
      zone_id: '00000000-0000-0000-0000-000000000001', // UUID de prueba
      reservation_date: new Date().toISOString(),
      start_time: '10:00',
      end_time: '12:00',
      total_amount: 100.00,
      status: 'pending',
      key: 'test-key-value' // Incluir la columna key
    };
    
    const { error: insertError } = await supabase
      .from('reservations')
      .insert(testData);
    
    if (insertError) {
      console.log('❌ Error en inserción de prueba:', insertError.message);
      if (insertError.message.includes('column "key" does not exist')) {
        console.log('💡 La columna key aún no existe en reservations. Ejecuta el SQL para agregarla.');
      }
    } else {
      console.log('✅ Inserción de prueba exitosa con columna key en reservations!');
      
      // Limpiar datos de prueba
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
      
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
verifyReservationsKeyColumn().then(() => {
  console.log('🏁 Verificación completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 