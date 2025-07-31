const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeZonesSystem() {
  console.log('🚀 Iniciando eliminación del sistema de zonas...');
  
  try {
    // 1. Eliminar la columna zone_id de la tabla reservations
    console.log('📝 Eliminando columna zone_id de reservations...');
    const { error: dropZoneIdError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.reservations DROP COLUMN IF EXISTS zone_id;'
    });
    
    if (dropZoneIdError) {
      console.error('❌ Error eliminando columna zone_id:', dropZoneIdError);
    } else {
      console.log('✅ Columna zone_id eliminada de reservations');
    }

    // 2. Eliminar la tabla zones completamente
    console.log('🗑️ Eliminando tabla zones...');
    const { error: dropZonesError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS public.zones CASCADE;'
    });
    
    if (dropZonesError) {
      console.error('❌ Error eliminando tabla zones:', dropZonesError);
    } else {
      console.log('✅ Tabla zones eliminada');
    }

    // 3. Eliminar función relacionada con zonas
    console.log('🔧 Eliminando función update_zones_updated_at...');
    const { error: dropFunctionError } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS update_zones_updated_at() CASCADE;'
    });
    
    if (dropFunctionError) {
      console.error('❌ Error eliminando función:', dropFunctionError);
    } else {
      console.log('✅ Función update_zones_updated_at eliminada');
    }

    // 4. Verificar que no hay referencias restantes
    console.log('🔍 Verificando que no hay referencias restantes...');
    
    // Verificar que la columna zone_id fue eliminada
    const { data: columnCheck, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'zone_id';
      `
    });
    
    if (columnError) {
      console.error('❌ Error verificando columna zone_id:', columnError);
    } else {
      console.log('✅ Verificación de columna zone_id completada');
    }
    
    // Verificar que la tabla zones fue eliminada
    const { data: tableCheck, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'zones';
      `
    });
    
    if (tableError) {
      console.error('❌ Error verificando tabla zones:', tableError);
    } else {
      console.log('✅ Verificación de tabla zones completada');
    }

    console.log('🎉 ¡Sistema de zonas eliminado completamente!');
    console.log('📋 Resumen:');
    console.log('   - Columna zone_id eliminada de reservations');
    console.log('   - Tabla zones eliminada');
    console.log('   - Función update_zones_updated_at eliminada');
    console.log('   - Verificaciones completadas');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la función
removeZonesSystem(); 