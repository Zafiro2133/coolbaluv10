// Script para diagnosticar el problema con set_admin_context
// Proyecto: rwgxdtfuzpdukaguogyh

import { createClient } from '@supabase/supabase-js';

// Configuración del proyecto - claves directamente
const SUPABASE_URL = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseSetAdminContext() {
  console.log('🔍 Diagnosticando problema con set_admin_context...');
  
  try {
    // Paso 1: Verificar autenticación
    console.log('📡 Paso 1: Verificando autenticación...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      return;
    }
    
    if (!session) {
      console.log('⚠️ No hay sesión activa');
      console.log('💡 Necesitas iniciar sesión para probar set_admin_context');
      return;
    }
    
    console.log('✅ Sesión activa encontrada');
    console.log('User ID:', session.user.id);
    console.log('User Email:', session.user.email);
    
    // Paso 2: Verificar si el usuario es admin
    console.log('👥 Paso 2: Verificando rol de admin...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('role', 'admin');
    
    if (rolesError) {
      console.error('❌ Error verificando roles:', rolesError.message);
    } else {
      console.log('✅ Verificación de roles exitosa');
      console.log('Es admin:', userRoles && userRoles.length > 0);
    }
    
    // Paso 3: Verificar si la función RPC existe
    console.log('🔧 Paso 3: Verificando existencia de funciones RPC...');
    
    // Probar set_admin_context_simple primero
    console.log('🧪 Probando set_admin_context_simple...');
    const { error: simpleError } = await supabase
      .rpc('set_admin_context_simple', {
        user_id: session.user.id,
        user_email: session.user.email || ''
      });
    
    if (simpleError) {
      console.error('❌ Error en set_admin_context_simple:', simpleError.message);
      console.error('Error details:', {
        code: simpleError.code,
        details: simpleError.details,
        hint: simpleError.hint
      });
    } else {
      console.log('✅ set_admin_context_simple funciona correctamente');
    }
    
    // Probar set_admin_context
    console.log('🧪 Probando set_admin_context...');
    const { error: fullError } = await supabase
      .rpc('set_admin_context', {
        user_id: session.user.id,
        user_email: session.user.email || ''
      });
    
    if (fullError) {
      console.error('❌ Error en set_admin_context:', fullError.message);
      console.error('Error details:', {
        code: fullError.code,
        details: fullError.details,
        hint: fullError.hint
      });
      
      // Verificar si es un error de función no encontrada
      if (fullError.message.includes('function') && fullError.message.includes('does not exist')) {
        console.log('💡 La función set_admin_context no existe');
        console.log('🔧 Necesitas ejecutar el SQL de corrección');
      }
    } else {
      console.log('✅ set_admin_context funciona correctamente');
    }
    
    // Paso 4: Verificar funciones disponibles
    console.log('📋 Paso 4: Verificando funciones RPC disponibles...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, security_type')
      .eq('routine_schema', 'public')
      .like('routine_name', '%admin%');
    
    if (functionsError) {
      console.log('⚠️ No se pudieron listar las funciones (normal si no hay permisos)');
    } else {
      console.log('📋 Funciones relacionadas con admin encontradas:');
      functions?.forEach(func => {
        console.log(`  - ${func.routine_name} (${func.routine_type}, ${func.security_type})`);
      });
    }
    
    console.log('🎉 Diagnóstico completado');
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el diagnóstico
diagnoseSetAdminContext().then(() => {
  console.log('🏁 Diagnóstico completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 