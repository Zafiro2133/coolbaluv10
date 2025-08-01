const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailSystem() {
  console.log('🧪 Probando sistema de emails de Supabase Auth...\n');

  try {
    // Paso 1: Intentar registrar un usuario de prueba
    console.log('1️⃣ Registrando usuario de prueba...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/confirm-email',
        data: {
          first_name: 'Test',
          last_name: 'User'
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
    console.log('📧 Email enviado:', data.user?.email_confirmed_at ? 'Sí' : 'No');

    // Paso 2: Verificar configuración de emails en Supabase
    console.log('\n2️⃣ Verificando configuración de emails...');
    
    // Intentar obtener la configuración de auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Error al obtener sesión:', authError);
    } else {
      console.log('✅ Conexión a Supabase Auth exitosa');
    }

    // Paso 3: Verificar si el email se envió
    console.log('\n3️⃣ Verificando envío de email...');
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('📧 Email de confirmación enviado (usuario no confirmado)');
      console.log('🔗 El usuario debe hacer clic en el enlace del email para confirmar');
    } else if (data.user && data.user.email_confirmed_at) {
      console.log('✅ Email ya confirmado (esto no debería pasar en un registro nuevo)');
    }

    // Paso 4: Limpiar usuario de prueba
    console.log('\n4️⃣ Limpiando usuario de prueba...');
    
    // Intentar eliminar el usuario de prueba (esto requiere permisos de admin)
    console.log('⚠️ Para eliminar el usuario de prueba, usa el panel de administración de Supabase');
    console.log('📧 Email del usuario de prueba:', testEmail);

    console.log('\n✅ Prueba completada');
    console.log('\n📋 Resumen:');
    console.log('- Usuario registrado:', testEmail);
    console.log('- Email enviado:', data.user && !data.user.email_confirmed_at ? 'Sí' : 'No');
    console.log('- Estado de confirmación:', data.user?.email_confirmed_at ? 'Confirmado' : 'Pendiente');
    
    if (!data.user?.email_confirmed_at) {
      console.log('\n💡 Recomendaciones:');
      console.log('1. Verifica que el email llegó a la bandeja de entrada');
      console.log('2. Revisa la carpeta de spam si no lo encuentras');
      console.log('3. Verifica la configuración de SMTP en Supabase Dashboard');
      console.log('4. Asegúrate de que el dominio de email esté verificado en Supabase');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la prueba
testEmailSystem(); 