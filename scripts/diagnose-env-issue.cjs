#!/usr/bin/env node

/**
 * Script para diagnosticar problemas con variables de entorno
 * Verifica que las variables estén disponibles en el navegador
 */

require('dotenv').config();

console.log('🔍 Diagnóstico de Variables de Entorno\n');

// Verificar variables del archivo .env
console.log('📁 Variables en archivo .env:');
const envVars = {
  'RESEND_API_KEY': process.env.RESEND_API_KEY,
  'RESEND_FROM_EMAIL': process.env.RESEND_FROM_EMAIL,
  'VITE_APP_NAME': process.env.VITE_APP_NAME,
  'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
};

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${key}: NO CONFIGURADO`);
  }
});

console.log('\n🔧 Soluciones posibles:');
console.log('1. Asegúrate de que el archivo .env esté en la raíz del proyecto');
console.log('2. Reinicia el servidor de desarrollo después de cambiar .env');
console.log('3. Verifica que no haya espacios extra en las variables');
console.log('4. En Vite, las variables deben empezar con VITE_ para ser accesibles en el navegador');

console.log('\n⚠️  IMPORTANTE: Para variables accesibles en el navegador con Vite:');
console.log('- RESEND_API_KEY debe ser VITE_RESEND_API_KEY');
console.log('- RESEND_FROM_EMAIL debe ser VITE_RESEND_FROM_EMAIL');

console.log('\n📋 Recomendación:');
console.log('Actualiza tu archivo .env para usar el prefijo VITE_ en las variables que necesitas en el navegador:');
console.log('VITE_RESEND_API_KEY=tu-api-key');
console.log('VITE_RESEND_FROM_EMAIL=tu-email'); 