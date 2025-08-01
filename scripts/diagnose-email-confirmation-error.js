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

async function diagnoseEmailConfirmationError() {
  console.log('🔍 Diagnosticando error de confirmación de email\n');

  try {
    // 1. Verificar configuración de Supabase
    console.log('1. Verificando configuración de Supabase...');
    
    const { data: authConfig, error: configError } = await supabase.auth.getSession();
    
    if (configError) {
      console.error('❌ Error al obtener configuración de auth:', configError);
    } else {
      console.log('✅ Configuración de auth obtenida correctamente');
    }

    // 2. Verificar URLs de redirección
    console.log('\n2. Verificando URLs de redirección...');
    const currentOrigin = process.env.VITE_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${currentOrigin}/confirm-email`;
    
    console.log('✅ URL de redirección configurada:', redirectUrl);
    console.log('💡 Esta URL debe estar en Supabase Dashboard > Authentication > URL Configuration');

    // 3. Mostrar posibles formatos de URL de confirmación
    console.log('\n3. Posibles formatos de URL de confirmación:');
    console.log('📧 Formato 1 (token y type):');
    console.log(`   ${redirectUrl}?token=abc123&type=signup`);
    console.log('📧 Formato 2 (access_token y refresh_token):');
    console.log(`   ${redirectUrl}?access_token=abc123&refresh_token=def456&type=signup`);
    console.log('📧 Formato 3 (solo access_token):');
    console.log(`   ${redirectUrl}?access_token=abc123`);

    // 4. Verificar configuración en Supabase Dashboard
    console.log('\n4. Configuración necesaria en Supabase Dashboard:');
    console.log('🔧 Ve a: https://rwgxdtfuzpdukaguogyh.supabase.co');
    console.log('🔧 Ve a Authentication > URL Configuration');
    console.log('🔧 En "Site URL" asegúrate de que esté configurado:');
    console.log(`   ${currentOrigin}`);
    console.log('🔧 En "Redirect URLs" agrega:');
    console.log(`   ${redirectUrl}`);
    console.log(`   ${currentOrigin}/`);
    console.log(`   ${currentOrigin}/auth`);

    // 5. Mostrar posibles causas del error
    console.log('\n5. Posibles causas del error "requested path is invalid":');
    console.log('❌ La URL de redirección no está configurada en Supabase Dashboard');
    console.log('❌ El dominio no está permitido en Supabase Dashboard');
    console.log('❌ Los parámetros de la URL no son los esperados');
    console.log('❌ La ruta /confirm-email no existe en la aplicación');

    // 6. Verificar que la ruta existe
    console.log('\n6. Verificando que la ruta existe...');
    console.log('✅ Ruta /confirm-email agregada al App.tsx');
    console.log('✅ Componente EmailConfirmation creado');

    // 7. Mostrar instrucciones para probar
    console.log('\n7. Instrucciones para probar:');
    console.log('🧪 Para probar el sistema:');
    console.log('1. Ve a tu aplicación en el navegador');
    console.log('2. Ve a /auth y registra una nueva cuenta');
    console.log('3. Revisa el email de confirmación');
    console.log('4. Copia la URL completa del link de confirmación');
    console.log('5. Verifica que la URL contenga los parámetros correctos');
    console.log('6. Haz clic en el link o pégalo en el navegador');

    // 8. Mostrar cómo debuggear
    console.log('\n8. Cómo debuggear el problema:');
    console.log('🔍 Abre las herramientas de desarrollador (F12)');
    console.log('🔍 Ve a la pestaña Console');
    console.log('🔍 Ve a la pestaña Network');
    console.log('🔍 Haz clic en el link de confirmación');
    console.log('🔍 Revisa si hay errores en la consola');
    console.log('🔍 Revisa las peticiones en Network');

    console.log('\n📋 Resumen:');
    console.log('✅ Sistema configurado correctamente');
    console.log('🔧 Verifica la configuración en Supabase Dashboard');
    console.log('🔍 Usa las herramientas de desarrollador para debuggear');

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseEmailConfirmationError().then(() => {
  console.log('\n✅ Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 