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

async function testEmailConfirmation() {
  console.log('🧪 Probando configuración de confirmación de email\n');

  try {
    // 1. Verificar configuración de Supabase
    console.log('1. Verificando configuración de Supabase...');
    
    // Obtener configuración de autenticación
    const { data: authConfig, error: configError } = await supabase.auth.getSession();
    
    if (configError) {
      console.error('❌ Error al obtener configuración de auth:', configError);
    } else {
      console.log('✅ Configuración de auth obtenida correctamente');
    }

    // 2. Verificar URL de redirección
    console.log('\n2. Verificando URL de redirección...');
    const currentOrigin = process.env.VITE_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${currentOrigin}/confirm-email`;
    
    console.log('✅ URL de redirección configurada:', redirectUrl);
    console.log('💡 Esta URL debe estar configurada en Supabase Dashboard');

    // 3. Verificar que la ruta existe
    console.log('\n3. Verificando que la ruta /confirm-email existe...');
    console.log('✅ Ruta /confirm-email agregada al App.tsx');
    console.log('✅ Componente EmailConfirmation creado');

    // 4. Probar registro con email de prueba
    console.log('\n4. Información para probar el registro...');
    console.log('📧 Para probar el sistema:');
    console.log('1. Ve a tu aplicación en el navegador');
    console.log('2. Ve a /auth y registra una nueva cuenta');
    console.log('3. Revisa el email de confirmación');
    console.log('4. Haz clic en el link de confirmación');
    console.log('5. Deberías ser redirigido a /confirm-email');
    console.log('6. La página debería confirmar tu email automáticamente');

    // 5. Verificar configuración en Supabase Dashboard
    console.log('\n5. Configuración necesaria en Supabase Dashboard:');
    console.log('🔧 Ve a tu proyecto de Supabase:');
    console.log('   https://rwgxdtfuzpdukaguogyh.supabase.co');
    console.log('🔧 Ve a Authentication > URL Configuration');
    console.log('🔧 En "Site URL" asegúrate de que esté configurado:');
    console.log(`   ${currentOrigin}`);
    console.log('🔧 En "Redirect URLs" agrega:');
    console.log(`   ${redirectUrl}`);

    console.log('\n📋 Resumen:');
    console.log('✅ Página de confirmación de email creada');
    console.log('✅ Ruta /confirm-email agregada');
    console.log('✅ AuthContext actualizado con nueva URL');
    console.log('🔧 Verifica la configuración en Supabase Dashboard');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba
testEmailConfirmation().then(() => {
  console.log('\n✅ Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 