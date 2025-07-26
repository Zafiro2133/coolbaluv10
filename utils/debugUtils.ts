import { supabase } from '@/services/supabase/client';

/**
 * Función de debug para verificar el estado de autenticación
 */
export const debugAuthStatus = async () => {
  console.log('=== DEBUG AUTH STATUS ===');
  
  try {
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('❌ No session found');
      return;
    }
    
    console.log('✅ Session found');
    console.log('User ID:', session.user.id);
    console.log('User email:', session.user.email);
    console.log('Access token exists:', !!session.access_token);
    console.log('Token expires at:', session.expires_at);
    
    // Verificar si el token está expirado
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.warn('⚠️ Token expired');
    } else {
      console.log('✅ Token is valid');
    }
    
    // Intentar hacer una consulta simple para verificar permisos
    console.log('=== TESTING USER_ROLES QUERY ===');
    
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id);
    
    if (userRolesError) {
      console.error('❌ Error querying user_roles:', userRolesError);
      console.error('Error code:', userRolesError.code);
      console.error('Error message:', userRolesError.message);
      console.error('Error details:', userRolesError.details);
    } else {
      console.log('✅ user_roles query successful');
      console.log('User roles found:', userRoles?.length || 0);
      if (userRoles && userRoles.length > 0) {
        console.log('Roles:', userRoles.map(r => r.role));
      }
    }
    
    // Verificar si es admin usando una consulta directa
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('❌ Error checking admin role:', adminError);
    } else {
      console.log('✅ Admin check successful');
      console.log('Is admin:', adminRoles && adminRoles.length > 0);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in debug:', error);
  }
  
  console.log('=== END DEBUG ===');
};

/**
 * Función para verificar headers de la petición
 */
export const debugRequestHeaders = async () => {
  console.log('=== DEBUG REQUEST HEADERS ===');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ No session available');
      return;
    }
    
    // Usar las variables de entorno para la URL y key
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    
    // Crear una petición manual para verificar headers
    const response = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=*&user_id=eq.${session.user.id}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
    } else {
      const data = await response.json();
      console.log('✅ Response successful');
      console.log('Data:', data);
    }
    
  } catch (error) {
    console.error('❌ Error in header debug:', error);
  }
  
  console.log('=== END HEADER DEBUG ===');
}; 