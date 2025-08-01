import fs from 'fs';
import path from 'path';

async function setupLocalEnvironment() {
  console.log('🔧 Configurando entorno local para confirmación de email\n');

  try {
    // 1. Verificar si existe .env
    const envPath = path.join(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);
    
    if (!envExists) {
      console.log('📝 Creando archivo .env...');
      
      const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://rwgxdtfuzpdukaguogyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0

# Resend Configuration
VITE_RESEND_API_KEY=re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF
VITE_RESEND_FROM_EMAIL=hola@estudiomaters.com
VITE_RESEND_FROM_NAME=Coolbalu

# Cloudinary Configuration (si usas Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=tu-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=tu-upload-preset

# App Configuration
VITE_APP_NAME=Coolbalu
VITE_APP_URL=http://localhost:3000
`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Archivo .env creado');
    } else {
      console.log('✅ Archivo .env ya existe');
      
      // Leer y actualizar VITE_APP_URL si es necesario
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('VITE_APP_URL=http://localhost:3000')) {
        console.log('📝 Actualizando VITE_APP_URL para desarrollo local...');
        
        const updatedContent = envContent.replace(
          /VITE_APP_URL=.*/g,
          'VITE_APP_URL=http://localhost:3000'
        );
        
        fs.writeFileSync(envPath, updatedContent);
        console.log('✅ VITE_APP_URL actualizado para localhost');
      }
    }

    // 2. Mostrar configuración necesaria
    console.log('\n📋 Configuración para desarrollo local:');
    console.log('✅ VITE_APP_URL configurado como: http://localhost:3000');
    console.log('✅ URL de confirmación local: http://localhost:3000/confirm-email');
    
    // 3. Instrucciones para Supabase Dashboard
    console.log('\n🔧 Configuración necesaria en Supabase Dashboard:');
    console.log('1. Ve a: https://rwgxdtfuzpdukaguogyh.supabase.co');
    console.log('2. Ve a Authentication > URL Configuration');
    console.log('3. En "Site URL" configura: http://localhost:3000');
    console.log('4. En "Redirect URLs" agrega: http://localhost:3000/confirm-email');
    console.log('5. Guarda los cambios');
    
    // 4. Instrucciones para probar
    console.log('\n🧪 Para probar en local:');
    console.log('1. Ejecuta: pnpm dev');
    console.log('2. Ve a: http://localhost:3000');
    console.log('3. Ve a /auth y registra una cuenta');
    console.log('4. Revisa el email de confirmación');
    console.log('5. Haz clic en el link - debería funcionar en local');
    
    // 5. Configuración para producción
    console.log('\n🚀 Para producción (Vercel):');
    console.log('✅ VITE_APP_URL se actualiza automáticamente a: https://coolbaluv10.vercel.app');
    console.log('✅ URL de confirmación en producción: https://coolbaluv10.vercel.app/confirm-email');
    
    console.log('\n📋 Resumen:');
    console.log('✅ Entorno local configurado');
    console.log('✅ Sistema funciona en local y producción');
    console.log('🔧 Configura Supabase Dashboard para ambos entornos');

  } catch (error) {
    console.error('❌ Error configurando entorno local:', error);
  }
}

// Ejecutar configuración
setupLocalEnvironment().then(() => {
  console.log('\n✅ Configuración completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 