// Script para ejecutar el SQL y agregar la columna key a reservation_items
// Usando las credenciales del proyecto: rwgxdtfuzpdukaguogyh

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

// Configuración del proyecto desde archivo centralizado
const SUPABASE_URL = SUPABASE_CONFIG.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = SUPABASE_CONFIG.SERVICE_ROLE_KEY;

// Crear cliente de Supabase con service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addKeyColumn() {
  console.log('🔧 Iniciando proceso para agregar columna key...');
  
  try {
    // SQL para agregar la columna key
    const sql = `
      -- Agregar la columna key como TEXT opcional
      ALTER TABLE public.reservation_items 
      ADD COLUMN IF NOT EXISTS "key" TEXT;
      
      -- Agregar comentario para documentar el propósito
      COMMENT ON COLUMN public.reservation_items."key" IS 'Columna para manejar propiedades extra de React (como key)';
    `;
    
    console.log('📝 Ejecutando SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      return;
    }
    
    console.log('✅ SQL ejecutado correctamente');
    
    // Verificar que la columna se agregó
    console.log('🔍 Verificando que la columna se agregó...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'reservation_items')
      .eq('column_name', 'key')
      .eq('table_schema', 'public');
    
    if (checkError) {
      console.error('❌ Error verificando columna:', checkError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Columna "key" agregada exitosamente!');
      console.log('📊 Detalles de la columna:', columns[0]);
    } else {
      console.log('⚠️ La columna no se encontró en la verificación');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la función
addKeyColumn().then(() => {
  console.log('🏁 Proceso completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 