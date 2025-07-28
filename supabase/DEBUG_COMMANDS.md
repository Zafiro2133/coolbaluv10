# Comandos de Debugging para Consola del Navegador

## Verificación Rápida de la URL Problemática

Ejecuta este comando en la consola del navegador (F12 > Console):

```javascript
// Verificar acceso a la URL específica que está fallando
fetch('https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png', {
  method: 'HEAD',
  mode: 'cors'
})
.then(response => {
  console.log('✅ Respuesta del servidor:');
  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  if (response.ok) {
    console.log('✅ La imagen debería ser accesible');
  } else {
    console.log('❌ La imagen no es accesible');
  }
})
.catch(error => {
  console.error('❌ Error de red:', error);
});
```

## Verificación de Configuración de Supabase

```javascript
// Verificar configuración del cliente Supabase
console.log('🔍 Verificando configuración de Supabase...');

// Verificar que el cliente esté disponible
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Cliente Supabase disponible');
} else {
  console.log('❌ Cliente Supabase no disponible');
}

// Verificar variables de entorno (si están expuestas)
console.log('🔍 Variables de entorno:');
console.log('VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado');
```

## Verificación de CORS

```javascript
// Probar diferentes métodos de acceso
const testUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png';

// Método 1: HEAD request
fetch(testUrl, { method: 'HEAD' })
  .then(r => console.log('HEAD Status:', r.status))
  .catch(e => console.error('HEAD Error:', e));

// Método 2: GET request
fetch(testUrl, { method: 'GET' })
  .then(r => console.log('GET Status:', r.status))
  .catch(e => console.error('GET Error:', e));

// Método 3: Con CORS
fetch(testUrl, { 
  method: 'HEAD',
  mode: 'cors',
  credentials: 'omit'
})
  .then(r => console.log('CORS Status:', r.status))
  .catch(e => console.error('CORS Error:', e));
```

## Verificación de Bucket y Políticas

```javascript
// Verificar acceso al bucket desde el cliente Supabase
// (Solo funciona si tienes acceso al cliente en la consola)

if (window.supabase) {
  // Listar buckets
  window.supabase.storage.listBuckets()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error al listar buckets:', error);
      } else {
        console.log('📦 Buckets disponibles:', data);
        const productImagesBucket = data?.find(b => b.name === 'product-images');
        console.log('📦 Bucket product-images:', productImagesBucket);
      }
    });

  // Listar archivos en product-images
  window.supabase.storage.from('product-images').list('', { limit: 10 })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error al listar archivos:', error);
      } else {
        console.log('📁 Archivos en product-images:', data);
      }
    });
}
```

## Verificación de URL de Imagen

```javascript
// Verificar si la URL tiene el formato correcto
const url = 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png';

console.log('🔍 Análisis de URL:');
console.log('URL completa:', url);
console.log('Dominio:', new URL(url).hostname);
console.log('Path:', new URL(url).pathname);
console.log('Protocolo:', new URL(url).protocol);

// Verificar si el archivo existe
const fileName = url.split('/').pop();
console.log('Nombre del archivo:', fileName);

// Verificar si el ID del producto está en la URL
const productId = url.split('/').slice(-2)[0];
console.log('ID del producto:', productId);
```

## Comando de Verificación Completa

```javascript
// Comando completo para verificar todo
async function debugImageAccess() {
  console.log('🔍 === INICIO DEBUGGING COMPLETO ===');
  
  const testUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/product-images/19008e6d-76fe-4981-95e4-8b2dfac97970/1753707362567.png';
  
  try {
    // 1. Verificar configuración
    console.log('1️⃣ Verificando configuración...');
    console.log('Cliente Supabase:', !!window.supabase);
    console.log('URL configurada:', import.meta.env?.VITE_SUPABASE_URL);
    
    // 2. Verificar acceso a la URL
    console.log('2️⃣ Verificando acceso a la URL...');
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Length:', response.headers.get('content-length'));
    
    // 3. Verificar si es un problema de CORS
    console.log('3️⃣ Verificando CORS...');
    const corsResponse = await fetch(testUrl, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('CORS Status:', corsResponse.status);
    
    // 4. Resumen
    console.log('4️⃣ Resumen:');
    if (response.ok) {
      console.log('✅ La imagen debería ser accesible');
    } else if (response.status === 403) {
      console.log('❌ Error 403: Problema de permisos (bucket no público o políticas incorrectas)');
    } else if (response.status === 404) {
      console.log('❌ Error 404: Archivo no encontrado');
    } else {
      console.log(`❌ Error ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.log('💡 Posibles causas:');
    console.log('- Problema de red');
    console.log('- CORS no configurado');
    console.log('- URL incorrecta');
  }
  
  console.log('🔍 === FIN DEBUGGING COMPLETO ===');
}

// Ejecutar el debugging completo
debugImageAccess();
```

## Interpretación de Resultados

### Status 200-299: ✅ Éxito
- La imagen debería ser accesible
- El problema podría estar en el componente React

### Status 403: ❌ Problema de Permisos
- El bucket no está configurado como público
- Las políticas de storage no permiten acceso público
- **Solución:** Verificar configuración en dashboard de Supabase

### Status 404: ❌ Archivo No Encontrado
- El archivo no existe en el storage
- La URL está mal formada
- **Solución:** Verificar que el archivo se subió correctamente

### Status 500+: ❌ Error del Servidor
- Problema en el servidor de Supabase
- **Solución:** Contactar soporte de Supabase

### Error de Red: ❌ Problema de Conectividad
- Problema de CORS
- Problema de red
- **Solución:** Verificar configuración de CORS 