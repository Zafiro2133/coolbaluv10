import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_CONFIG } from '@/config/supabase-config';

// Usar configuración centralizada con fallback a variables de entorno
const SUPABASE_URL = SUPABASE_CONFIG.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.ANON_PUBLIC_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar que las credenciales estén disponibles
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Faltan credenciales de Supabase');
  console.error('URL:', SUPABASE_URL);
  console.error('Key:', SUPABASE_ANON_KEY ? 'Presente' : 'Faltante');
  console.error('💡 Verifica que el archivo .env esté configurado correctamente');
  throw new Error('Configuración de Supabase incompleta');
}

console.log('🔧 Cliente Supabase inicializado con:', {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY ? 'Presente' : 'Faltante'
});

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
}); 