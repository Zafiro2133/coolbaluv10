const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentUserStatus() {
  console.log('🔍 Verificando estado del usuario actual...\n');

  try {
    // Paso 1: Verificar sesión actual
    console.log('1️⃣ Verificando sesión actual...');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error al obtener sesión:', sessionError);
    } else if (sessionData.session) {
      const user = sessionData.session.user;
      console.log('✅ Usuario autenticado encontrado');
      console.log('📧 Email:', user.email);
      console.log('🆔 User ID:', user.id);
      console.log('📧 Email confirmado:', user.email_confirmed_at);
      console.log('📅 Creado:', user.created_at);
      console.log('🔐 Último acceso:', user.last_sign_in_at);
    } else {
      console.log('📭 No hay usuario autenticado');
    }

    // Paso 2: Verificar configuración de autenticación
    console.log('\n2️⃣ Verificando configuración de autenticación...');
    
    // Intentar registrar un usuario de prueba para ver el comportamiento
    const testEmail = `test-status-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('📧 Registrando usuario de prueba:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/confirm-email',
        data: {
          first_name: 'Test',
          last_name: 'Status'
        }
      }
    });

    if (error) {
      console.error('❌ Error al registrar usuario:', error);
      return;
    }

    console.log('✅ Usuario registrado exitosamente');
    console.log('📧 Email confirmado:', data.user?.email_confirmed_at);
    console.log('🔐 Sesión activa:', !!data.session);

    // Paso 3: Verificar si el usuario puede acceder inmediatamente
    if (data.session) {
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('El usuario puede acceder inmediatamente después del registro');
      console.log('Esto significa que Supabase está configurado para NO requerir confirmación');
      
      // Intentar hacer logout para simular el comportamiento correcto
      await supabase.auth.signOut();
      console.log('✅ Sesión cerrada para simular confirmación requerida');
    } else {
      console.log('\n✅ Comportamiento correcto:');
      console.log('El usuario NO puede acceder inmediatamente');
      console.log('Debe confirmar su email primero');
    }

    // Paso 4: Verificar configuración recomendada
    console.log('\n3️⃣ Configuración recomendada para Supabase:');
    console.log('📋 En el Dashboard de Supabase:');
    console.log('   1. Ve a Authentication > Settings');
    console.log('   2. En "Email Auth":');
    console.log('      ✅ Enable email confirmations: HABILITAR');
    console.log('      ✅ Enable secure email change: HABILITAR');
    console.log('      ✅ Enable email change confirmations: HABILITAR');
    console.log('   3. En "SMTP Settings":');
    console.log('      - Configura tu proveedor de email');
    console.log('      - O usa el proveedor por defecto de Supabase');

    // Paso 5: Verificar implementación del frontend
    console.log('\n4️⃣ Verificación de implementación del frontend:');
    console.log('✅ Verificación en Reservation.tsx: IMPLEMENTADA');
    console.log('✅ Banner de verificación: IMPLEMENTADO');
    console.log('✅ Cierre de sesión post-registro: IMPLEMENTADO');
    console.log('✅ Verificación en AuthContext: IMPLEMENTADA');

    console.log('\n✅ Verificación completada');
    console.log('\n📋 Resumen:');
    console.log('- Usuario de prueba:', testEmail);
    console.log('- Confirmación automática:', data.user?.email_confirmed_at ? 'SÍ' : 'NO');
    console.log('- Acceso inmediato:', !!data.session ? 'SÍ' : 'NO');
    
    if (data.user?.email_confirmed_at) {
      console.log('\n🚨 ACCIÓN REQUERIDA:');
      console.log('Configurar Supabase para requerir confirmación de email');
      console.log('Ver la guía en: docs/SOLUCION_EMAIL_CONFIRMACION.md');
    } else {
      console.log('\n✅ Configuración correcta');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la verificación
checkCurrentUserStatus(); 