// Script para crear el archivo .env automáticamente
import fs from 'fs';
import path from 'path';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

console.log('🔧 Creando archivo .env...');

const envContent = `# Variables de entorno para Supabase
# Proyecto: ${SUPABASE_CONFIG.PROJECT_NAME}
# Project ID: ${SUPABASE_CONFIG.PROJECT_ID}

VITE_SUPABASE_URL=${SUPABASE_CONFIG.SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.ANON_PUBLIC_KEY}

# Variables adicionales
VITE_APP_NAME=${SUPABASE_CONFIG.APP_NAME}
VITE_APP_VERSION=${SUPABASE_CONFIG.APP_VERSION}
`;

const envPath = path.join(process.cwd(), '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado exitosamente');
  console.log('📁 Ubicación:', envPath);
  console.log('📝 Contenido:');
  console.log(envContent);
} catch (error) {
  console.error('❌ Error creando archivo .env:', error.message);
  console.log('💡 Crea manualmente el archivo .env con este contenido:');
  console.log(envContent);
} 