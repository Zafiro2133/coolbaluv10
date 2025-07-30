// Script para diagnosticar el problema de la API key
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

console.log('🔍 Diagnosticando problema de API key...');

// Probar diferentes configuraciones
async function testConfigurations() {
  const configs = [
    {
      name: 'Configuración centralizada',
      url: SUPABASE_CONFIG.SUPABASE_URL,
      key: SUPABASE_CONFIG.ANON_PUBLIC_KEY
    },
    {
      name: 'Variables de entorno (simuladas)',
      url: 'https://rwgxdtfuzpdukaguogyh.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0'
    }
  ];

  for (const config of configs) {
    console.log(`\n🧪 Probando: ${config.name}`);
    console.log(`   URL: ${config.url}`);
    console.log(`   Key: ${config.key ? 'Presente' : 'Faltante'}`);
    
    try {
      const supabase = createClient(config.url, config.key);
      
      // Probar una consulta simple
      const { data, error } = await supabase
        .from('reservation_items')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('No API key found')) {
          console.log('   💡 Problema: API key no encontrada en la petición');
        }
      } else {
        console.log(`   ✅ Éxito: ${JSON.stringify(data)}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }
}

// Probar configuración del navegador
async function testBrowserConfig() {
  console.log('\n🌐 Simulando configuración del navegador...');
  
  // Simular el entorno del navegador
  const browserConfig = {
    url: SUPABASE_CONFIG.SUPABASE_URL,
    key: SUPABASE_CONFIG.ANON_PUBLIC_KEY,
    options: {
      auth: {
        storage: typeof localStorage !== 'undefined' ? localStorage : null,
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    }
  };
  
  console.log('   Configuración del navegador:');
  console.log(`   URL: ${browserConfig.url}`);
  console.log(`   Key: ${browserConfig.key ? 'Presente' : 'Faltante'}`);
  console.log(`   Headers: ${JSON.stringify(browserConfig.options.global.headers)}`);
  
  try {
    const supabase = createClient(browserConfig.url, browserConfig.key, browserConfig.options);
    
    const { data, error } = await supabase
      .from('reservation_items')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Error del navegador: ${error.message}`);
    } else {
      console.log(`   ✅ Éxito del navegador: ${JSON.stringify(data)}`);
    }
    
  } catch (error) {
    console.log(`   💥 Error del navegador: ${error.message}`);
  }
}

// Ejecutar diagnósticos
async function runDiagnostics() {
  await testConfigurations();
  await testBrowserConfig();
  
  console.log('\n📋 Resumen del diagnóstico:');
  console.log('1. Verificar que la aplicación use la configuración centralizada');
  console.log('2. Verificar que no haya conflictos con variables de entorno');
  console.log('3. Verificar que el cliente de Supabase se inicialice correctamente');
  console.log('4. Verificar que las peticiones incluyan el header apikey');
}

runDiagnostics().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error en el diagnóstico:', error);
  process.exit(1);
}); 