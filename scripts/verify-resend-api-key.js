import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no está configurado en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyResendApiKey() {
  console.log('🔍 Verificando API key de Resend\n');

  // API key actual del código
  const currentApiKey = 're_joWXR676_MZuHU9v6sMYBdZBMXB129XrF';
  
  console.log('1. Probando API key actual...');
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${currentApiKey}`
      }
    });

    if (response.ok) {
      console.log('✅ API key actual funciona correctamente');
      const domains = await response.json();
      console.log(`   Dominios verificados: ${domains.data?.length || 0}`);
    } else {
      console.error('❌ API key actual no funciona:', response.status, response.statusText);
      
      if (response.status === 401) {
        console.log('\n🔧 La API key actual no es válida. Necesitas:');
        console.log('1. Ir a https://resend.com/');
        console.log('2. Crear una cuenta o iniciar sesión');
        console.log('3. Ir a la sección API Keys');
        console.log('4. Crear una nueva API key');
        console.log('5. Verificar tu dominio (estudiomaters.com)');
        console.log('6. Actualizar la API key en el código');
      }
    }
  } catch (error) {
    console.error('❌ Error al conectar con Resend:', error.message);
  }

  // Verificar si hay una API key en las variables de entorno
  const envApiKey = process.env.RESEND_API_KEY;
  if (envApiKey && envApiKey !== currentApiKey) {
    console.log('\n2. Probando API key de variables de entorno...');
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${envApiKey}`
        }
      });

      if (response.ok) {
        console.log('✅ API key de variables de entorno funciona correctamente');
        console.log('💡 Considera actualizar la API key en el código');
      } else {
        console.error('❌ API key de variables de entorno no funciona:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error al conectar con Resend usando API key de env:', error.message);
    }
  }

  // Probar envío de email de prueba
  console.log('\n3. Probando envío de email de prueba...');
  try {
    const testEmailData = {
      from: 'hola@estudiomaters.com',
      to: 'test@example.com',
      subject: 'Prueba de email - Coolbalu',
      html: '<h1>Prueba de email</h1><p>Este es un email de prueba para verificar que el sistema funciona.</p>'
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmailData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email de prueba enviado correctamente');
      console.log(`   Email ID: ${result.id}`);
    } else {
      const errorData = await response.json();
      console.error('❌ Error al enviar email de prueba:', errorData);
      
      if (errorData.message?.includes('domain')) {
        console.log('\n🔧 Problema con el dominio. Necesitas:');
        console.log('1. Verificar que estudiomaters.com esté configurado en Resend');
        console.log('2. Configurar los registros DNS correctos');
        console.log('3. Esperar a que la verificación se complete');
      }
    }
  } catch (error) {
    console.error('❌ Error al enviar email de prueba:', error.message);
  }

  console.log('\n📋 Resumen:');
  console.log('Para que los emails funcionen correctamente:');
  console.log('1. Verifica que tu API key de Resend sea válida');
  console.log('2. Asegúrate de que el dominio estudiomaters.com esté verificado');
  console.log('3. Configura los registros DNS correctos');
  console.log('4. Ejecuta el script fix-email-system.sql en Supabase');
}

// Ejecutar verificación
verifyResendApiKey().then(() => {
  console.log('\n✅ Verificación completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 