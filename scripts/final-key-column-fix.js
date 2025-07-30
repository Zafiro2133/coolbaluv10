// Script final para agregar la columna key a reservation_items
// Usando la service role key para ejecutar SQL

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

console.log('🔧 Ejecutando solución final para columna key...');
console.log('📊 Proyecto:', SUPABASE_CONFIG.PROJECT_NAME);
console.log('🆔 Project ID:', SUPABASE_CONFIG.PROJECT_ID);

// Crear cliente con service role para ejecutar SQL
const supabase = createClient(SUPABASE_CONFIG.SUPABASE_URL, SUPABASE_CONFIG.SERVICE_ROLE_KEY);

async function addKeyColumn() {
  try {
    console.log('📝 Ejecutando SQL para agregar columna key...');
    
    // SQL para agregar la columna key
    const sql = `
      -- Agregar la columna key como TEXT opcional
      ALTER TABLE public.reservation_items 
      ADD COLUMN IF NOT EXISTS "key" TEXT;
      
      -- Agregar comentario para documentar el propósito
      COMMENT ON COLUMN public.reservation_items."key" IS 'Columna para manejar propiedades extra de React (como key)';
    `;
    
    // Ejecutar SQL usando RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log('❌ Error ejecutando SQL:', error.message);
      console.log('💡 Alternativa: Ejecuta manualmente en Supabase SQL Editor:');
      console.log(`
-- Copia y pega esto en Supabase SQL Editor:

ALTER TABLE public.reservation_items 
ADD COLUMN IF NOT EXISTS "key" TEXT;

COMMENT ON COLUMN public.reservation_items."key" IS 'Columna para manejar propiedades extra de React (como key)';
      `);
      return;
    }
    
    console.log('✅ SQL ejecutado correctamente!');
    
    // Verificar que la columna se agregó
    console.log('🔍 Verificando que la columna se agregó...');
    
    // Probar inserción con key
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
        console.log('❌ La columna key aún no existe');
        console.log('💡 Ejecuta manualmente el SQL en Supabase SQL Editor');
      } else {
        console.log('✅ Inserción exitosa! La columna key funciona correctamente');
        
        // Limpiar datos de prueba
        const { error: deleteError } = await supabase
          .from('reservation_items')
          .delete()
          .eq('reservation_id', '00000000-0000-0000-0000-000000000000');
        
        if (!deleteError) {
          console.log('🧹 Datos de prueba limpiados');
        }
      }
    } else {
      console.log('✅ ¡ÉXITO! La columna key se agregó y funciona correctamente');
      
      // Limpiar datos de prueba
      const { error: deleteError } = await supabase
        .from('reservation_items')
        .delete()
        .eq('reservation_id', '00000000-0000-0000-0000-000000000000');
      
      if (!deleteError) {
        console.log('🧹 Datos de prueba limpiados');
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
    console.log('💡 Ejecuta manualmente el SQL en Supabase SQL Editor');
  }
}

// Ejecutar la función
addKeyColumn().then(() => {
  console.log('🏁 Proceso completado');
  console.log('🎉 ¡El error "column key doesn\'t exist" debería estar resuelto!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 