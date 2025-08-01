const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthConfig() {
  console.log('🔍 Verificando configuración de autenticación de Supabase...\n');

  try {
    // Paso 1: Verificar configuración actual
    console.log('1️⃣ Verificando configuración actual...');
    
    // Intentar obtener información de la configuración de auth
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error al obtener sesión:', sessionError);
    } else {
      console.log('✅ Conexión a Supabase Auth exitosa');
    }

    // Paso 2: Probar registro con confirmación explícita
    console.log('\n2️⃣ Probando registro con confirmación explícita...');
    
    const testEmail = `test-confirm-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/confirm-email',
        data: {
          first_name: 'Test',
          last_name: 'Confirm'
        }
      }
    });

    if (error) {
      console.error('❌ Error al registrar usuario:', error);
      return;
    }

    console.log('✅ Usuario registrado exitosamente');
    console.log('📧 Email:', testEmail);
    console.log('🆔 User ID:', data.user?.id);
    console.log('📧 Email confirmado:', data.user?.email_confirmed_at);
    console.log('📧 Confirmado automáticamente:', data.user?.email_confirmed_at ? 'SÍ' : 'NO');

    // Paso 3: Verificar si hay configuración de confirmación
    console.log('\n3️⃣ Verificando configuración de confirmación...');
    
    if (data.user?.email_confirmed_at) {
      console.log('⚠️  PROBLEMA DETECTADO: El email se confirma automáticamente');
      console.log('📧 Esto significa que Supabase está configurado para NO requerir confirmación');
      console.log('🔧 Para solucionarlo, necesitas:');
      console.log('   1. Ir al Dashboard de Supabase');
      console.log('   2. Authentication > Settings');
      console.log('   3. Deshabilitar "Enable email confirmations"');
      console.log('   4. O configurar correctamente el SMTP');
    } else {
      console.log('✅ Email requiere confirmación (configuración correcta)');
    }

    // Paso 4: Verificar configuración de SMTP
    console.log('\n4️⃣ Verificando configuración de SMTP...');
    console.log('📧 Para verificar la configuración de SMTP:');
    console.log('   1. Ve al Dashboard de Supabase');
    console.log('   2. Authentication > Settings > SMTP Settings');
    console.log('   3. Verifica que esté configurado correctamente');
    console.log('   4. O usa el proveedor por defecto de Supabase');

    console.log('\n✅ Verificación completada');
    console.log('\n📋 Resumen:');
    console.log('- Usuario registrado:', testEmail);
    console.log('- Confirmación automática:', data.user?.email_confirmed_at ? 'SÍ' : 'NO');
    
    if (data.user?.email_confirmed_at) {
      console.log('\n🚨 ACCIÓN REQUERIDA:');
      console.log('El sistema está configurado para NO requerir confirmación de email.');
      console.log('Esto es un problema de seguridad. Necesitas configurar Supabase correctamente.');
    } else {
      console.log('\n✅ Configuración correcta: Los usuarios deben confirmar su email.');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la verificación
checkAuthConfig(); 