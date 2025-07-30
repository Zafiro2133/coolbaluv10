// Script para verificar que el problema de API key se ha resuelto
// Proyecto: rwgxdtfuzpdukaguogyh

import { createClient } from '@supabase/supabase-js';

// Configuración del proyecto - claves directamente
const SUPABASE_URL = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApiKeyFix() {
  console.log('🔍 Probando que el problema de API key se ha resuelto...');
  
  try {
    // Prueba 1: Verificar conexión básica
    console.log('📡 Prueba 1: Verificando conexión básica...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error en conexión básica:', testError.message);
      if (testError.message.includes('No API key found')) {
        console.error('💥 El problema de API key PERSISTE');
        return;
      }
    } else {
      console.log('✅ Conexión básica exitosa');
    }
    
    // Prueba 2: Verificar autenticación
    console.log('🔐 Prueba 2: Verificando autenticación...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Error en autenticación:', authError.message);
    } else {
      console.log('✅ Autenticación verificada');
      console.log('Session exists:', !!session);
    }
    
    // Prueba 3: Verificar acceso a user_roles (el que causaba el error 406)
    console.log('👥 Prueba 3: Verificando acceso a user_roles...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    if (rolesError) {
      console.error('❌ Error accediendo a user_roles:', rolesError.message);
      console.error('Error details:', {
        code: rolesError.code,
        details: rolesError.details,
        hint: rolesError.hint
      });
    } else {
      console.log('✅ Acceso a user_roles exitoso');
      console.log('Roles encontrados:', rolesData?.length || 0);
    }
    
    // Prueba 4: Verificar acceso a reservation_items
    console.log('📋 Prueba 4: Verificando acceso a reservation_items...');
    const { data: itemsData, error: itemsError } = await supabase
      .from('reservation_items')
      .select('*')
      .limit(1);
    
    if (itemsError) {
      console.error('❌ Error accediendo a reservation_items:', itemsError.message);
    } else {
      console.log('✅ Acceso a reservation_items exitoso');
      console.log('Items encontrados:', itemsData?.length || 0);
      
      // Verificar si la columna key existe
      if (itemsData && itemsData.length > 0) {
        const firstItem = itemsData[0];
        if ('key' in firstItem) {
          console.log('✅ Columna "key" existe en reservation_items');
        } else {
          console.log('❌ Columna "key" NO existe en reservation_items');
        }
      }
    }
    
    console.log('🎉 Todas las pruebas completadas');
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar las pruebas
testApiKeyFix().then(() => {
  console.log('🏁 Pruebas completadas');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 