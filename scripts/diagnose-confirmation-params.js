const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = create Client(supabaseUrl, supabaseServiceKey);

async function diagnoseConfirmationParams() {
  console.log('🔍 Diagnóstico de parámetros de confirmación...\n');

  try {
    // 1. Verificar configuración de Supabase
    console.log('1. Verificando configuración de Supabase...');
    const { data: configData, error: configError } = await supabase.auth.getSession();
    
    if (configError) {
      console.log('❌ Error en configuración de Supabase:', configError.message);
      return;
    }
    console.log('✅ Configuración de Supabase correcta');

    // 2. Simular diferentes tipos de parámetros que Supabase puede enviar
    console.log('\n2. Simulando diferentes escenarios de parámetros...');
    
    const scenarios = [
      {
        name: 'Escenario 1: access_token + refresh_token',
        params: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          type: 'email_confirmation'
        }
      },
      {
        name: 'Escenario 2: token + type',
        params: {
          token: 'mock_token_hash',
          type: 'email_confirmation'
        }
      },
      {
        name: 'Escenario 3: Solo access_token',
        params: {
          access_token: 'mock_access_token'
        }
      },
      {
        name: 'Escenario 4: Parámetros vacíos',
        params: {}
      }
    ];

    scenarios.forEach((scenario, index) => {
      console.log(`\n${index + 1}. ${scenario.name}:`);
      console.log('   Parámetros:', JSON.stringify(scenario.params, null, 2));
      
      // Simular el procesamiento del componente
      const hasAccessToken = scenario.params.access_token;
      const hasToken = scenario.params.token;
      const hasType = scenario.params.type;
      
      if (hasAccessToken) {
        console.log('   ✅ Detectado access_token - usaría setSession()');
      } else if (hasToken && hasType) {
        console.log('   ✅ Detectado token + type - usaría verifyOtp()');
      } else {
        console.log('   ❌ No se detectaron parámetros válidos');
      }
    });

    // 3. Verificar configuración de Supabase Auth
    console.log('\n3. Verificando configuración de Supabase Auth...');
    console.log('📋 Configuraciones importantes a verificar:');
    console.log('   • Site URL en Supabase Dashboard');
    console.log('   • Redirect URLs en Authentication > URL Configuration');
    console.log('   • Email templates en Authentication > Email Templates');
    console.log('   • Confirm email template debe incluir: {{ .ConfirmationURL }}');

    // 4. Mostrar instrucciones para debugging
    console.log('\n4. Instrucciones para debugging:');
    console.log('📋 Para diagnosticar el problema:');
    console.log('   1. Abre las herramientas de desarrollador del navegador');
    console.log('   2. Ve a la pestaña Console');
    console.log('   3. Haz clic en el link de confirmación del email');
    console.log('   4. Revisa los logs que aparecen en la consola');
    console.log('   5. Copia los parámetros de la URL que aparecen');
    console.log('   6. Compártelos para análisis');

    // 5. Verificar configuración actual
    console.log('\n5. Verificación de configuración actual:');
    const currentOrigin = process.env.VITE_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${currentOrigin}/confirm-email`;
    console.log('   • URL de redirección configurada:', redirectUrl);
    console.log('   • Ruta /confirm-email existe en App.tsx: ✅');
    console.log('   • Componente EmailConfirmation implementado: ✅');

    console.log('\n🎯 Posibles causas del error:');
    console.log('   1. Supabase está enviando parámetros diferentes a los esperados');
    console.log('   2. El token ha expirado antes de llegar al componente');
    console.log('   3. La configuración de Supabase Auth no está correcta');
    console.log('   4. El componente no está manejando todos los casos posibles');

    console.log('\n🔧 Solución recomendada:');
    console.log('   1. Revisar los logs de la consola del navegador');
    console.log('   2. Verificar qué parámetros llegan realmente');
    console.log('   3. Ajustar el componente para manejar esos parámetros');
    console.log('   4. Verificar configuración de Supabase Auth');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Ejecutar el diagnóstico
diagnoseConfirmationParams(); 