// Script para verificar la configuración de la aplicación
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

console.log('🔧 Verificando configuración de la aplicación...');

try {
  console.log('📊 Configuración cargada:');
  console.log(`   Project ID: ${SUPABASE_CONFIG.PROJECT_ID}`);
  console.log(`   Project Name: ${SUPABASE_CONFIG.PROJECT_NAME}`);
  console.log(`   URL: ${SUPABASE_CONFIG.SUPABASE_URL}`);
  console.log(`   Anon Key: ${SUPABASE_CONFIG.ANON_PUBLIC_KEY ? 'Presente' : 'Faltante'}`);
  console.log(`   Service Key: ${SUPABASE_CONFIG.SERVICE_ROLE_KEY ? 'Presente' : 'Faltante'}`);
  
  // Verificar que las credenciales estén completas
  if (!SUPABASE_CONFIG.SUPABASE_URL) {
    throw new Error('URL de Supabase faltante');
  }
  
  if (!SUPABASE_CONFIG.ANON_PUBLIC_KEY) {
    throw new Error('Anon Key de Supabase faltante');
  }
  
  if (!SUPABASE_CONFIG.SERVICE_ROLE_KEY) {
    throw new Error('Service Role Key de Supabase faltante');
  }
  
  console.log('✅ Configuración válida');
  
  // Verificar formato de las credenciales
  if (!SUPABASE_CONFIG.SUPABASE_URL.startsWith('https://')) {
    throw new Error('URL de Supabase debe comenzar con https://');
  }
  
  if (!SUPABASE_CONFIG.ANON_PUBLIC_KEY.includes('eyJ')) {
    throw new Error('Anon Key debe ser un JWT válido');
  }
  
  if (!SUPABASE_CONFIG.SERVICE_ROLE_KEY.includes('eyJ')) {
    throw new Error('Service Role Key debe ser un JWT válido');
  }
  
  console.log('✅ Formato de credenciales válido');
  console.log('🎉 Configuración lista para usar');
  
} catch (error) {
  console.error('❌ Error en la configuración:', error.message);
  process.exit(1);
} 