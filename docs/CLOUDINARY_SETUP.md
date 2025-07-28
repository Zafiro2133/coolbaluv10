# 🚀 Configuración de Cloudinary para Carga de Imágenes

## 📋 Resumen

Esta guía te ayudará a configurar Cloudinary para reemplazar Supabase Storage en la funcionalidad de carga de imágenes.

## 🎯 Ventajas de Cloudinary

- ✅ **Sin problemas de MIME types**
- ✅ **Optimización automática de imágenes**
- ✅ **CDN global**
- ✅ **Transformaciones en la URL**
- ✅ **Plan gratuito generoso** (25GB/mes)
- ✅ **Más fácil de implementar**

## 🔧 Paso 1: Crear Cuenta en Cloudinary

1. Ve a [cloudinary.com](https://cloudinary.com)
2. Haz clic en **"Sign Up For Free"**
3. Completa el registro con tu email
4. Verifica tu cuenta

## 🔧 Paso 2: Obtener Credenciales

1. **Inicia sesión** en tu dashboard de Cloudinary
2. **Ve a Dashboard** → **Account Details**
3. **Copia estos valores:**
   - **Cloud Name**: `coolbaluv10` (o el que elijas)
   - **API Key**: (no necesaria para subida directa)
   - **API Secret**: (no necesaria para subida directa)

## 🔧 Paso 3: Configurar Upload Preset

1. **Ve a Settings** → **Upload**
2. **Scroll down** hasta **"Upload presets"**
3. **Haz clic en "Add upload preset"**
4. **Configura el preset:**
   - **Preset name**: `coolbaluv10_products`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `products`
   - **Access Mode**: `Public`
   - **Invalidate CDN**: `Yes`

5. **Guarda el preset**

## 🔧 Paso 4: Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local`:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=coolbaluv10
VITE_CLOUDINARY_UPLOAD_PRESET=coolbaluv10_products
```

## 🔧 Paso 5: Actualizar el Código

El componente ya está configurado, pero puedes personalizar las variables:

```typescript
// En components/ui/cloudinary-image-upload.tsx
const cloudName = 'tu-cloud-name';
const uploadPreset = 'tu-upload-preset';
```

## 🧪 Paso 6: Probar la Funcionalidad

1. **Inicia el servidor**: `pnpm dev`
2. **Ve a** Panel de Administración → Gestión de Catálogo
3. **Crea o edita** un producto
4. **Sube una imagen** - debería funcionar sin problemas

## 🔍 Verificación

### En la Consola del Navegador
Deberías ver:
```
🚀 Subiendo imagen a Cloudinary: {name: "imagen.png", type: "image/png", size: 123456}
✅ Imagen subida exitosamente: https://res.cloudinary.com/coolbaluv10/image/upload/...
```

### En Cloudinary Dashboard
1. **Ve a Media Library**
2. **Busca la carpeta** `products`
3. **Verifica** que las imágenes se suban correctamente

## 🎨 Transformaciones de Imagen

Cloudinary permite transformaciones automáticas en la URL:

```typescript
// Imagen redimensionada a 300x300
const resizedUrl = imageUrl.replace('/upload/', '/upload/w_300,h_300,c_fill/');

// Imagen optimizada para web
const optimizedUrl = imageUrl.replace('/upload/', '/upload/f_auto,q_auto/');

// Imagen con formato WebP
const webpUrl = imageUrl.replace('/upload/', '/upload/f_webp/');
```

## 📊 Monitoreo y Estadísticas

### En Cloudinary Dashboard
- **Usage**: Ve a Dashboard → Usage
- **Bandwidth**: Monitorea el uso de ancho de banda
- **Storage**: Verifica el espacio utilizado

### Funciones de Utilidad
```typescript
// Obtener estadísticas de uso
const getUsageStats = async () => {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/coolbaluv10/usage?api_key=${apiKey}&signature=${signature}`
  );
  return response.json();
};
```

## 🔒 Seguridad

### Configuraciones Recomendadas
1. **Upload Preset**: Configurado como `Unsigned`
2. **Folder**: Organizado en `products/`
3. **Access Mode**: `Public` para imágenes de productos
4. **File Types**: Solo imágenes permitidas

### Límites de Seguridad
```typescript
// En el componente
const maxSize = 5 * 1024 * 1024; // 5MB
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

## 🚀 Optimizaciones

### Transformaciones Automáticas
```typescript
// Agregar transformaciones automáticas
const optimizedImageUrl = imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
```

### Lazy Loading
```typescript
// Implementar lazy loading
<img 
  src={imageUrl} 
  loading="lazy"
  alt="Producto"
/>
```

## 🔧 Solución de Problemas

### Error: "Upload preset not found"
- Verifica que el preset esté configurado como `Unsigned`
- Confirma el nombre del preset en el código

### Error: "Invalid cloud name"
- Verifica el Cloud Name en el dashboard
- Confirma que esté correcto en el código

### Error: "File too large"
- Verifica el límite de tamaño en Cloudinary
- Ajusta el límite en el componente si es necesario

### Error: "Invalid file type"
- Verifica que el archivo sea una imagen válida
- Confirma los tipos permitidos en el código

## 📈 Escalabilidad

### Plan Gratuito
- **25GB** de almacenamiento
- **25GB** de ancho de banda/mes
- **25,000** transformaciones/mes

### Planes de Pago
- **Plus**: $89/mes - 225GB almacenamiento
- **Advanced**: $224/mes - 500GB almacenamiento

## 🎉 ¡Listo!

Con esta configuración, tendrás:
- ✅ Carga de imágenes sin problemas de MIME types
- ✅ Optimización automática
- ✅ CDN global
- ✅ Transformaciones flexibles
- ✅ Monitoreo completo

¡La funcionalidad estará operativa y mucho más confiable que con Supabase Storage! 🚀 