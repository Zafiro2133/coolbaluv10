# Guía de Debugging para Hook.js Issues

## 🎯 Objetivo
Esta guía te ayudará a identificar y solucionar problemas relacionados con `hook.js:377` y otros errores de hooks en React.

## 🚀 Cómo usar el Componente DebugHookIssues

### 1. Acceder al Componente
1. Ve a la página de Debug: `/debug`
2. Busca la sección "🐛 Debug Hook Issues"
3. Haz clic en "Iniciar Monitoreo"

### 2. Interpretar los Resultados

#### Tipos de Issues:
- 🔴 **Error**: Problemas críticos que pueden romper la aplicación
- 🟡 **Warning**: Advertencias que pueden causar problemas
- 🔵 **Info**: Información útil sobre el estado del sistema

#### Información Mostrada:
- **Timestamp**: Cuándo ocurrió el error
- **Message**: Descripción del problema
- **Stack Trace**: Ruta exacta donde ocurrió (expandible)

### 3. Acciones Disponibles
- **Iniciar Monitoreo**: Comienza a capturar errores
- **Detener Monitoreo**: Para de capturar errores
- **Limpiar Issues**: Borra todos los issues detectados

## 🔧 Problemas Comunes y Soluciones

### Error: "hook.js:377 - React DevTools hook not found"
**Causa**: React DevTools no está disponible o hay conflictos
**Solución**:
1. Desactiva la extensión React DevTools del navegador
2. Recarga la página
3. Si persiste, usa modo incógnito

### Error: "Hook useEffect was called conditionally"
**Causa**: Hooks llamados dentro de condicionales
**Solución**:
```tsx
// ❌ Incorrecto
if (condition) {
  useEffect(() => {}, []);
}

// ✅ Correcto
useEffect(() => {
  if (condition) {
    // lógica aquí
  }
}, [condition]);
```

### Error: "useQuery hook called outside of QueryClient provider"
**Causa**: React Query no está configurado correctamente
**Solución**:
```tsx
// Asegúrate de que QueryClient envuelva tu app
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* tu app aquí */}
    </QueryClientProvider>
  );
}
```

### Error: "Cannot read property 'rendererPackageName' of undefined"
**Causa**: Conflicto con React DevTools
**Solución**:
1. Actualiza React DevTools a la última versión
2. Desactiva temporalmente la extensión
3. Verifica que React y React DevTools sean compatibles

## 🧪 Scripts de Prueba

### Script de Prueba Automático
Ejecuta en la consola del navegador:
```javascript
// Cargar script de prueba
fetch('/scripts/test-hook-debug.js')
  .then(response => response.text())
  .then(script => eval(script));

// Simular errores
window.hookDebugTest.simulateErrors();

// Verificar estado
window.hookDebugTest.checkState();
```

### Verificación Manual
```javascript
// Verificar React DevTools
console.log('React DevTools:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Verificar React
console.log('React:', window.React?.version);

// Verificar QueryClient
console.log('QueryClient:', window.QueryClient);
```

## 🔍 Debugging Avanzado

### 1. Verificar Dependencias
```bash
# Verificar versiones de React
pnpm list react react-dom

# Verificar React Query
pnpm list @tanstack/react-query

# Verificar Supabase
pnpm list @supabase/supabase-js
```

### 2. Verificar Configuración de Vite
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    // Asegúrate de que estas variables estén definidas
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});
```

### 3. Verificar Variables de Entorno
```bash
# .env.local
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui
```

## 🚨 Soluciones de Emergencia

### Si la aplicación no carga:
1. **Limpiar caché del navegador** (Ctrl+Shift+Delete)
2. **Desactivar extensiones** del navegador
3. **Usar modo incógnito**
4. **Reiniciar el servidor de desarrollo**:
   ```bash
   pnpm dev
   ```

### Si persisten los errores:
1. **Verificar logs del servidor** en la terminal
2. **Revisar la consola del navegador** (F12)
3. **Usar el componente DebugHookIssues** para capturar errores específicos
4. **Contactar al equipo de desarrollo** con los logs capturados

## 📊 Interpretación de Logs

### Errores Críticos (🔴)
- Requieren atención inmediata
- Pueden romper la aplicación
- Ejemplo: "Cannot read property of undefined"

### Advertencias (🟡)
- No rompen la aplicación pero pueden causar problemas
- Ejemplo: "Hook called conditionally"

### Información (🔵)
- Estado del sistema
- Ejemplo: "React DevTools disponible"

## 🎯 Próximos Pasos

1. **Ejecuta el componente DebugHookIssues**
2. **Captura los errores específicos**
3. **Aplica las soluciones correspondientes**
4. **Verifica que los errores se resuelvan**
5. **Documenta cualquier solución nueva**

## 📞 Soporte

Si necesitas ayuda adicional:
1. Revisa esta guía completa
2. Usa el componente DebugHookIssues
3. Captura logs específicos
4. Contacta al equipo con información detallada 