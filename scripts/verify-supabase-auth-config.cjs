const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySupabaseAuthConfig() {
  console.log('🔍 Verificando configuración de Supabase Auth...\n');

  try {
    // 1. Verificar conexión básica
    console.log('1. Verificando conexión con Supabase...');
    const { data: configData, error: configError } = await supabase.auth.getSession();
    
    if (configError) {
      console.log('❌ Error en conexión con Supabase:', configError.message);
      return;
    }
    console.log('✅ Conexión con Supabase exitosa');

    // 2. Verificar configuración de URLs
    console.log('\n2. Verificando configuración de URLs...');
    const currentOrigin = process.env.VITE_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${currentOrigin}/confirm-email`;
    
    console.log('📋 URLs que deben estar configuradas en Supabase Dashboard:');
    console.log('   • Site URL:', currentOrigin);
    console.log('   • Redirect URL:', redirectUrl);
    console.log('   • Additional Redirect URLs:', redirectUrl);

    // 3. Verificar configuración de email
    console.log('\n3. Verificando configuración de email...');
    console.log('📋 Configuraciones de email a verificar:');
    console.log('   • Confirm email template debe incluir: {{ .ConfirmationURL }}');
    console.log('   • Email template debe estar habilitado');
    console.log('   • SMTP settings configurados (si usas SMTP personalizado)');

    // 4. Verificar configuración de autenticación
    console.log('\n4. Verificando configuración de autenticación...');
    console.log('📋 Configuraciones de auth a verificar:');
    console.log('   • Email confirmations: ENABLED');
    console.log('   • Secure email change: ENABLED (opcional)');
    console.log('   • Double confirm changes: DISABLED (recomendado)');

    // 5. Mostrar instrucciones para configurar Supabase
    console.log('\n5. Instrucciones para configurar Supabase Auth:');
    console.log('📋 Pasos en Supabase Dashboard:');
    console.log('   1. Ve a Authentication > URL Configuration');
    console.log('   2. En "Site URL" pon:', currentOrigin);
    console.log('   3. En "Redirect URLs" agrega:', redirectUrl);
    console.log('   4. Ve a Authentication > Email Templates');
    console.log('   5. En "Confirm signup" template, asegúrate de que incluya:');
    console.log('      {{ .ConfirmationURL }}');
    console.log('   6. Guarda los cambios');

    // 6. Verificar variables de entorno
    console.log('\n6. Verificando variables de entorno...');
    const envVars = {
      'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
      'VITE_APP_URL': process.env.VITE_APP_URL,
      'VITE_RESEND_API_KEY': process.env.VITE_RESEND_API_KEY,
      'VITE_RESEND_FROM_EMAIL': process.env.VITE_RESEND_FROM_EMAIL
    };

    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: Configurado`);
      } else {
        console.log(`   ❌ ${key}: No configurado`);
      }
    });

    // 7. Probar registro de usuario
    console.log('\n7. Probando registro de usuario...');
    const testEmail = `test-config-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: 'Test',
            last_name: 'Config',
          }
        }
      });

      if (signUpError) {
        console.log('❌ Error en registro de prueba:', signUpError.message);
        console.log('💡 Posibles causas:');
        console.log('   • Email ya registrado');
        console.log('   • Configuración de Supabase incorrecta');
        console.log('   • Variables de entorno faltantes');
      } else {
        console.log('✅ Registro de prueba exitoso');
        console.log('📧 Email de confirmación enviado a:', testEmail);
        console.log('🔗 URL de redirección configurada:', redirectUrl);
      }
    } catch (error) {
      console.log('❌ Error durante prueba de registro:', error.message);
    }

    // 8. Resumen y recomendaciones
    console.log('\n8. Resumen y recomendaciones:');
    console.log('📋 Para solucionar problemas de confirmación:');
    console.log('   1. Verifica que las URLs estén correctamente configuradas en Supabase');
    console.log('   2. Asegúrate de que el template de email incluya {{ .ConfirmationURL }}');
    console.log('   3. Verifica que todas las variables de entorno estén configuradas');
    console.log('   4. Revisa los logs de la consola del navegador para ver errores específicos');
    console.log('   5. Si el problema persiste, verifica la configuración de CORS en Supabase');

    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Configura las URLs en Supabase Dashboard');
    console.log('   2. Verifica el template de email');
    console.log('   3. Prueba el registro de un nuevo usuario');
    console.log('   4. Revisa los logs en la consola del navegador');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar la verificación
verifySupabaseAuthConfig(); 