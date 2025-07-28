# Comandos de Debugging para Componente React

## Verificación del Componente ImageWithFallback

Ejecuta estos comandos en la consola del navegador para verificar el comportamiento del componente:

### 1. Verificar si el componente está renderizando correctamente

```javascript
// Buscar todos los elementos img en la página
const images = document.querySelectorAll('img');
console.log('🔍 Total de imágenes en la página:', images.length);

// Verificar las imágenes que usan ImageWithFallback
images.forEach((img, index) => {
  console.log(`📷 Imagen ${index + 1}:`, {
    src: img.src,
    alt: img.alt,
    className: img.className,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    complete: img.complete,
    currentSrc: img.currentSrc
  });
});
```

### 2. Verificar el estado de carga de imágenes específicas

```javascript
// Verificar la imagen problemática específicamente
const problemImage = document.querySelector('img[src*="1753707362567"]');
if (problemImage) {
  console.log('🔍 Imagen problemática encontrada:', {
    src: problemImage.src,
    alt: problemImage.alt,
    className: problemImage.className,
    naturalWidth: problemImage.naturalWidth,
    naturalHeight: problemImage.naturalHeight,
    complete: problemImage.complete,
    currentSrc: problemImage.currentSrc,
    parentElement: problemImage.parentElement?.className
  });
} else {
  console.log('❌ Imagen problemática no encontrada en el DOM');
}
```

### 3. Verificar si hay errores de CORS en la consola

```javascript
// Verificar errores de CORS
const corsErrors = [];
const originalConsoleError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('CORS')) {
    corsErrors.push(args);
  }
  originalConsoleError.apply(console, args);
};

// Esperar un momento y luego verificar
setTimeout(() => {
  console.log('🔍 Errores de CORS detectados:', corsErrors);
  console.error = originalConsoleError; // Restaurar console.error original
}, 2000);
```

### 4. Verificar el estado del componente React

```javascript
// Verificar si React DevTools está disponible
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools disponible');
} else {
  console.log('❌ React DevTools no disponible');
}

// Verificar el estado de los componentes
const reactRoot = document.querySelector('#root') || document.querySelector('[data-reactroot]');
if (reactRoot) {
  console.log('🔍 React Root encontrado:', reactRoot);
} else {
  console.log('❌ React Root no encontrado');
}
```

### 5. Verificar la carga de imágenes con diferentes métodos

```javascript
// Probar carga de imagen con diferentes métodos
const testUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png';

// Método 1: Crear imagen programáticamente
const testImg1 = document.createElement('img');
testImg1.onload = () => console.log('✅ Método 1: Imagen cargada correctamente');
testImg1.onerror = () => console.log('❌ Método 1: Error al cargar imagen');
testImg1.src = testUrl;

// Método 2: Con crossOrigin
const testImg2 = document.createElement('img');
testImg2.crossOrigin = 'anonymous';
testImg2.onload = () => console.log('✅ Método 2: Imagen cargada con crossOrigin');
testImg2.onerror = () => console.log('❌ Método 2: Error con crossOrigin');
testImg2.src = testUrl;

// Método 3: Con fetch
fetch(testUrl, { method: 'HEAD' })
  .then(response => {
    if (response.ok) {
      console.log('✅ Método 3: Fetch HEAD exitoso');
    } else {
      console.log('❌ Método 3: Fetch HEAD falló:', response.status);
    }
  })
  .catch(error => console.log('❌ Método 3: Fetch error:', error));
```

### 6. Verificar el timing de carga

```javascript
// Verificar el timing de carga de imágenes
const startTime = performance.now();

const timingImg = document.createElement('img');
timingImg.onload = () => {
  const loadTime = performance.now() - startTime;
  console.log(`✅ Imagen cargada en ${loadTime.toFixed(2)}ms`);
};
timingImg.onerror = () => {
  const errorTime = performance.now() - startTime;
  console.log(`❌ Error después de ${errorTime.toFixed(2)}ms`);
};
timingImg.src = testUrl;
```

### 7. Verificar el estado del DOM

```javascript
// Verificar el estado actual del DOM
console.log('🔍 Estado del DOM:');

// Verificar contenedores de imágenes
const imageContainers = document.querySelectorAll('[class*="ImageWithFallback"]');
console.log('Contenedores ImageWithFallback:', imageContainers.length);

// Verificar elementos con loading spinner
const loadingSpinners = document.querySelectorAll('[class*="animate-spin"]');
console.log('Loading spinners:', loadingSpinners.length);

// Verificar elementos con fallback
const fallbackIcons = document.querySelectorAll('[class*="text-muted-foreground"]');
console.log('Fallback icons:', fallbackIcons.length);
```

### 8. Comando de verificación completa

```javascript
// Comando completo para debugging del componente
async function debugReactComponent() {
  console.log('🔍 === INICIO DEBUGGING REACT COMPONENT ===');
  
  const testUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png';
  
  // 1. Verificar DOM
  console.log('1️⃣ Verificando DOM...');
  const images = document.querySelectorAll('img');
  console.log('Total imágenes:', images.length);
  
  const problemImage = document.querySelector(`img[src*="1753707362567"]`);
  console.log('Imagen problemática en DOM:', !!problemImage);
  
  // 2. Verificar carga programática
  console.log('2️⃣ Verificando carga programática...');
  const testImg = document.createElement('img');
  testImg.crossOrigin = 'anonymous';
  
  const loadPromise = new Promise((resolve, reject) => {
    testImg.onload = () => resolve('success');
    testImg.onerror = () => reject('error');
  });
  
  testImg.src = testUrl;
  
  try {
    await loadPromise;
    console.log('✅ Carga programática exitosa');
  } catch (error) {
    console.log('❌ Carga programática falló:', error);
  }
  
  // 3. Verificar fetch
  console.log('3️⃣ Verificando fetch...');
  try {
    const response = await fetch(testUrl, { method: 'HEAD' });
    console.log('Fetch status:', response.status);
  } catch (error) {
    console.log('Fetch error:', error);
  }
  
  // 4. Verificar timing
  console.log('4️⃣ Verificando timing...');
  const startTime = performance.now();
  const timingImg = document.createElement('img');
  
  const timingPromise = new Promise((resolve) => {
    timingImg.onload = () => resolve(performance.now() - startTime);
    timingImg.onerror = () => resolve(performance.now() - startTime);
  });
  
  timingImg.src = testUrl;
  const loadTime = await timingPromise;
  console.log(`Tiempo de carga: ${loadTime.toFixed(2)}ms`);
  
  console.log('🔍 === FIN DEBUGGING REACT COMPONENT ===');
}

// Ejecutar debugging completo
debugReactComponent();
```

## Interpretación de Resultados

### Si la carga programática funciona pero el componente no:
- **Problema:** El componente React tiene un bug
- **Solución:** Revisar la implementación del componente

### Si la carga programática también falla:
- **Problema:** Problema de red o CORS
- **Solución:** Verificar configuración de Supabase

### Si hay errores de timing:
- **Problema:** La imagen tarda mucho en cargar
- **Solución:** Implementar mejor manejo de timeouts

### Si hay errores de CORS:
- **Problema:** Configuración de CORS incorrecta
- **Solución:** Verificar configuración en Supabase 