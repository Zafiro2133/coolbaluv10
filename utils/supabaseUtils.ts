import { supabase } from '@/services/supabase/client';

/**
 * Verifica que el usuario esté autenticado y tenga una sesión válida
 */
export const ensureAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw new Error('Error de autenticación');
  }
  
  if (!session) {
    throw new Error('Usuario no autenticado');
  }
  
  return session;
};

/**
 * Verifica que los headers de autenticación estén configurados correctamente
 */
export const verifyAuthHeaders = async () => {
  const session = await ensureAuthenticated();
  
  // Verificar que el token esté presente
  if (!session.access_token) {
    throw new Error('Token de acceso no disponible');
  }
  
  console.log('Auth headers verified for user:', session.user.id);
  return session;
};

/**
 * Función wrapper para consultas que requieren autenticación
 */
export const authenticatedQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    await verifyAuthHeaders();
    return await queryFn();
  } catch (error) {
    console.error('Authentication error in query:', error);
    return { data: null, error };
  }
}; 