// Script para crear el archivo .env automáticamente
import fs from 'fs';
import path from 'path';

async function createEnvFile() {
  console.log('🔧 Creando archivo .env\n');

  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://rwgxdtfuzpdukaguogyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0

# Resend Configuration
RESEND_API_KEY=re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF
VITE_RESEND_API_KEY=re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF
VITE_RESEND_FROM_EMAIL=hola@estudiomaters.com
VITE_RESEND_FROM_NAME=Coolbalu

# Cloudinary Configuration (si usas Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=tu-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=tu-upload-preset

# App Configuration
VITE_APP_NAME=Coolbalu
VITE_APP_URL=https://tu-dominio.vercel.app
`;

  try {
    fs.writeFileSync('.env', envContent, 'utf8');
    console.log('✅ Archivo .env creado correctamente');
    console.log('\n📋 Nota importante:');
    console.log('La API key de Resend actual puede no ser válida.');
    console.log('Para que los emails funcionen correctamente:');
    console.log('1. Ve a https://resend.com/');
    console.log('2. Crea una cuenta o inicia sesión');
    console.log('3. Ve a la sección API Keys');
    console.log('4. Crea una nueva API key');
    console.log('5. Actualiza RESEND_API_KEY en el archivo .env');
    console.log('6. Verifica tu dominio (estudiomaters.com)');
    console.log('7. Ejecuta el script fix-email-system.sql en Supabase');
  } catch (error) {
    console.error('❌ Error al crear archivo .env:', error.message);
  }
}

// Ejecutar creación
createEnvFile().then(() => {
  console.log('\n✅ Proceso completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 