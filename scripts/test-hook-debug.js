// Script de prueba para simular errores de hook.js
// Ejecutar en la consola del navegador para probar el componente DebugHookIssues

console.log('🧪 Iniciando pruebas de hook.js...');

// Función para simular diferentes tipos de errores
function simulateHookErrors() {
  console.log('🔧 Simulando errores de hook.js...');
  
  // Simular error de hook.js:377
  setTimeout(() => {
    console.error('Error en hook.js:377 - React DevTools hook not found');
  }, 1000);
  
  // Simular warning de hooks
  setTimeout(() => {
    console.warn('Warning: Hook useEffect was called conditionally');
  }, 2000);
  
  // Simular error de React DevTools
  setTimeout(() => {
    console.error('hook.js:377 - Cannot read property \'rendererPackageName\' of undefined');
  }, 3000);
  
  // Simular error de React Query
  setTimeout(() => {
    console.error('Error: useQuery hook called outside of QueryClient provider');
  }, 4000);
  
  // Simular error global
  setTimeout(() => {
    const error = new Error('hook.js:377 - Global hook error');
    error.filename = 'hook.js';
    error.lineno = 377;
    window.dispatchEvent(new ErrorEvent('error', { error }));
  }, 5000);
}

// Función para verificar el estado actual
function checkCurrentState() {
  console.log('🔍 Estado actual del sistema:');
  
  // Verificar React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools hook disponible');
    console.log('React DevTools:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  } else {
    console.log('❌ React DevTools hook no disponible');
  }
  
  // Verificar React
  if (window.React) {
    console.log('✅ React disponible:', window.React.version);
  } else {
    console.log('❌ React no disponible');
  }
  
  // Verificar QueryClient
  if (window.QueryClient) {
    console.log('✅ QueryClient disponible');
  } else {
    console.log('❌ QueryClient no disponible');
  }
  
  // Verificar Supabase
  if (window.supabase) {
    console.log('✅ Supabase disponible');
  } else {
    console.log('❌ Supabase no disponible');
  }
}

// Función para limpiar errores simulados
function clearSimulatedErrors() {
  console.log('🧹 Limpiando errores simulados...');
  console.clear();
}

// Exportar funciones para uso manual
window.hookDebugTest = {
  simulateErrors: simulateHookErrors,
  checkState: checkCurrentState,
  clearErrors: clearSimulatedErrors
};

console.log('✅ Script de prueba cargado. Usa:');
console.log('- window.hookDebugTest.simulateErrors() para simular errores');
console.log('- window.hookDebugTest.checkState() para verificar estado');
console.log('- window.hookDebugTest.clearErrors() para limpiar errores');

// Verificar estado inicial
checkCurrentState(); 