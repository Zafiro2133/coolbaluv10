import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function updateResendApiKey() {
  console.log('🔧 Actualizando API key de Resend\n');

  const envApiKey = process.env.RESEND_API_KEY;
  
  if (!envApiKey) {
    console.error('❌ No se encontró RESEND_API_KEY en las variables de entorno');
    console.log('💡 Agrega RESEND_API_KEY=tu_api_key_aqui a tu archivo .env');
    return;
  }

  console.log('✅ API key encontrada en variables de entorno');

  // Archivos que necesitan actualización
  const filesToUpdate = [
    'config/resend.ts',
    'services/supabase/email.ts'
  ];

  for (const filePath of filesToUpdate) {
    try {
      console.log(`\n📝 Actualizando ${filePath}...`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Buscar y reemplazar la API key actual
      const currentApiKey = 're_joWXR676_MZuHU9v6sMYBdZBMXB129XrF';
      
      if (content.includes(currentApiKey)) {
        content = content.replace(new RegExp(currentApiKey, 'g'), envApiKey);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${filePath} actualizado correctamente`);
      } else {
        console.log(`ℹ️ ${filePath} no contiene la API key actual`);
      }
      
    } catch (error) {
      console.error(`❌ Error al actualizar ${filePath}:`, error.message);
    }
  }

  // Verificar si la actualización fue exitosa
  console.log('\n🔍 Verificando actualización...');
  
  try {
    const resendConfigContent = fs.readFileSync('config/resend.ts', 'utf8');
    if (resendConfigContent.includes(envApiKey)) {
      console.log('✅ API key actualizada correctamente en config/resend.ts');
    } else {
      console.log('⚠️ API key no encontrada en config/resend.ts');
    }
  } catch (error) {
    console.error('❌ Error al verificar config/resend.ts:', error.message);
  }

  console.log('\n📋 Próximos pasos:');
  console.log('1. Ejecuta el script fix-email-system.sql en Supabase SQL Editor');
  console.log('2. Verifica que el dominio estudiomaters.com esté configurado en Resend');
  console.log('3. Prueba hacer una reserva para verificar que los emails funcionen');
}

// Ejecutar actualización
updateResendApiKey().then(() => {
  console.log('\n✅ Actualización completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 