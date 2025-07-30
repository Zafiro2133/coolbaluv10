// Configuración centralizada del proyecto Supabase
// Proyecto: Coolbalu Entretenimientos
// Project ID: rwgxdtfuzpdukaguogyh

export const SUPABASE_CONFIG = {
  // Información del proyecto
  PROJECT_ID: 'rwgxdtfuzpdukaguogyh',
  PROJECT_NAME: 'Coolbalu Entretenimientos',
  
  // URLs
  SUPABASE_URL: 'https://rwgxdtfuzpdukaguogyh.supabase.co',
  
  // API Keys
  ANON_PUBLIC_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0',
  SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM3MTI5MSwiZXhwIjoyMDY4OTQ3MjkxfQ.yGa3Q8T9y9e6SdE08jH1_2SqhYmk1q18Tm_16izohno',
  
  // Configuración de la aplicación
  APP_NAME: 'Coolbalu',
  APP_VERSION: 'v1.0',
  
  // Configuración de desarrollo
  DEV_MODE: process.env.NODE_ENV === 'development',
  
  // Configuración de la base de datos
  DATABASE: {
    SCHEMA: 'public',
    TABLES: {
      RESERVATIONS: 'reservations',
      RESERVATION_ITEMS: 'reservation_items',
      PRODUCTS: 'products',
      CATEGORIES: 'categories',
      PROFILES: 'profiles',
      USER_ROLES: 'user_roles',
      ZONES: 'zones',
      AVAILABILITIES: 'availabilities',
      CONTACT_MESSAGES: 'contact_messages',
      CART_ITEMS: 'cart_items'
    }
  },
  
  // Configuración de storage
  STORAGE: {
    BUCKETS: {
      PRODUCT_IMAGES: 'product-images',
      PAYMENT_PROOFS: 'payment-proofs',
      TEMP_IMAGES: 'temp-images'
    }
  }
};

// Función para obtener la configuración según el entorno
export function getSupabaseConfig() {
  return {
    url: SUPABASE_CONFIG.SUPABASE_URL,
    anonKey: SUPABASE_CONFIG.ANON_PUBLIC_KEY,
    serviceKey: SUPABASE_CONFIG.SERVICE_ROLE_KEY
  };
}

// Función para validar la configuración
export function validateConfig() {
  const required = ['SUPABASE_URL', 'ANON_PUBLIC_KEY', 'SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !SUPABASE_CONFIG[key]);
  
  if (missing.length > 0) {
    throw new Error(`Configuración incompleta. Faltan: ${missing.join(', ')}`);
  }
  
  return true;
}

// Exportar configuración por defecto
export default SUPABASE_CONFIG; 