const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnconfirmedUsers() {
  console.log('🔍 Verificando usuarios sin email confirmado...\n');

  try {
    // Paso 1: Obtener todos los usuarios
    console.log('1️⃣ Obteniendo lista de usuarios...');
    
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error al obtener usuarios:', error);
      return;
    }

    if (!users || !users.users) {
      console.log('📭 No se encontraron usuarios');
      return;
    }

    console.log(`📊 Total de usuarios encontrados: ${users.users.length}`);

    // Paso 2: Filtrar usuarios sin email confirmado
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    const confirmedUsers = users.users.filter(user => user.email_confirmed_at);

    console.log(`✅ Usuarios con email confirmado: ${confirmedUsers.length}`);
    console.log(`⚠️  Usuarios sin email confirmado: ${unconfirmedUsers.length}`);

    // Paso 3: Mostrar detalles de usuarios sin confirmar
    if (unconfirmedUsers.length > 0) {
      console.log('\n📋 Usuarios sin email confirmado:');
      unconfirmedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`   - Creado: ${user.created_at}`);
        console.log(`   - Último acceso: ${user.last_sign_in_at || 'Nunca'}`);
        console.log(`   - Confirmado: ${user.email_confirmed_at || 'NO'}`);
        console.log('');
      });

      console.log('🚨 ACCIÓN REQUERIDA:');
      console.log('Estos usuarios pueden acceder al sistema sin confirmar su email.');
      console.log('Opciones:');
      console.log('1. Configurar Supabase para requerir confirmación');
      console.log('2. Enviar emails de confirmación manualmente');
      console.log('3. Deshabilitar acceso a estos usuarios temporalmente');
    } else {
      console.log('\n✅ Todos los usuarios tienen su email confirmado');
    }

    // Paso 4: Verificar usuarios recientes
    console.log('\n📅 Usuarios registrados en las últimas 24 horas:');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = users.users.filter(user => 
      new Date(user.created_at) > oneDayAgo
    );

    if (recentUsers.length > 0) {
      recentUsers.forEach((user, index) => {
        const confirmed = user.email_confirmed_at ? '✅' : '⚠️';
        console.log(`${index + 1}. ${confirmed} ${user.email} - ${user.created_at}`);
      });
    } else {
      console.log('📭 No hay usuarios registrados en las últimas 24 horas');
    }

    // Paso 5: Estadísticas generales
    console.log('\n📊 Estadísticas generales:');
    console.log(`- Total de usuarios: ${users.users.length}`);
    console.log(`- Con email confirmado: ${confirmedUsers.length} (${Math.round(confirmedUsers.length / users.users.length * 100)}%)`);
    console.log(`- Sin email confirmado: ${unconfirmedUsers.length} (${Math.round(unconfirmedUsers.length / users.users.length * 100)}%)`);

    // Paso 6: Recomendaciones
    console.log('\n💡 Recomendaciones:');
    
    if (unconfirmedUsers.length > 0) {
      console.log('1. Configurar Supabase para requerir confirmación de email');
      console.log('2. Enviar emails de confirmación a usuarios existentes');
      console.log('3. Implementar verificación de email en el frontend (YA IMPLEMENTADO)');
      console.log('4. Monitorear nuevos registros para asegurar confirmación');
    } else {
      console.log('1. El sistema está funcionando correctamente');
      console.log('2. Mantener la configuración actual');
      console.log('3. Monitorear nuevos registros');
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la verificación
checkUnconfirmedUsers(); 