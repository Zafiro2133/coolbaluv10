// Script para debuggear problemas relacionados con hook.js
// Ejecutar en la consola del navegador

console.log('🔍 Iniciando debugging de hook.js...');

// 1. Verificar si React DevTools está disponible
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools disponible');
  console.log('React DevTools hook:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
} else {
  console.log('❌ React DevTools no disponible');
}

// 2. Verificar el estado de React
if (window.React) {
  console.log('✅ React disponible:', window.React.version);
} else {
  console.log('❌ React no disponible en window');
}

// 3. Verificar si hay errores en la consola relacionados con hooks
const originalConsoleError = console.error;
const hookErrors = [];

console.error = function(...args) {
  const errorMessage = args.join(' ');
  if (errorMessage.includes('hook') || errorMessage.includes('Hook')) {
    hookErrors.push({
      message: errorMessage,
      stack: new Error().stack,
      timestamp: new Date().toISOString()
    });
  }
  originalConsoleError.apply(console, args);
};

// 4. Verificar el estado de los componentes React
setTimeout(() => {
  console.log('🔍 Errores de hooks detectados:', hookErrors);
  
  // Restaurar console.error original
  console.error = originalConsoleError;
  
  // 5. Verificar el estado del DOM
  const reactRoot = document.querySelector('#root') || document.querySelector('[data-reactroot]');
  if (reactRoot) {
    console.log('✅ React Root encontrado:', reactRoot);
    console.log('React Root children:', reactRoot.children.length);
  } else {
    console.log('❌ React Root no encontrado');
  }
  
  // 6. Verificar si hay elementos con errores
  const errorElements = document.querySelectorAll('[data-error]');
  console.log('🔍 Elementos con errores:', errorElements.length);
  
  // 7. Verificar el estado de las imágenes
  const images = document.querySelectorAll('img');
  console.log('🔍 Total de imágenes:', images.length);
  
  const brokenImages = Array.from(images).filter(img => !img.complete || img.naturalWidth === 0);
  console.log('🔍 Imágenes rotas:', brokenImages.length);
  
  // 8. Verificar el estado de las peticiones fetch
  const originalFetch = window.fetch;
  const fetchErrors = [];
  
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
      fetchErrors.push({
        url: args[0],
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    });
  };
  
  console.log('🔍 Errores de fetch detectados:', fetchErrors);
  
  // Restaurar fetch original
  window.fetch = originalFetch;
  
}, 2000);

// 9. Verificar el estado de las variables de entorno
console.log('🔍 Variables de entorno:', {
  NODE_ENV: process.env.NODE_ENV,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Definida' : 'No definida',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Definida' : 'No definida'
});

// 10. Verificar el estado de las dependencias
console.log('🔍 Dependencias disponibles:', {
  React: typeof React !== 'undefined',
  ReactDOM: typeof ReactDOM !== 'undefined',
  Supabase: typeof window.supabase !== 'undefined',
  QueryClient: typeof window.QueryClient !== 'undefined'
});

console.log('🔍 Debugging de hook.js completado'); 