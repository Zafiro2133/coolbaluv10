# Guía de Carga de Imágenes de Productos

## 📋 Resumen

Esta funcionalidad permite a los administradores cargar imágenes para los productos del catálogo de manera intuitiva y eficiente.

## ✨ Características

### 🎯 Funcionalidades Principales
- **Carga de imágenes**: Selección desde el ordenador o arrastrar y soltar
- **Validación automática**: Tipo de archivo y tamaño máximo
- **Vista previa**: Visualización inmediata de la imagen seleccionada
- **Reemplazo**: Cambiar imagen existente sin perder la anterior
- **Eliminación**: Remover imagen del producto
- **Progreso visual**: Indicador de carga con barra de progreso
- **Manejo de errores**: Mensajes claros y específicos

### 🔧 Especificaciones Técnicas
- **Formatos soportados**: JPG, PNG, WEBP
- **Tamaño máximo**: 5MB por imagen
- **Bucket de almacenamiento**: `product-images`
- **Organización**: `products/{product_id}/{timestamp}-{randomId}.{extension}`
- **URLs públicas**: Generación automática de URLs accesibles

## 🚀 Cómo Usar

### 1. Acceso a la Funcionalidad
1. Inicia sesión como administrador
2. Ve a **Panel de Administración** → **Gestión de Catálogo**
3. Selecciona la pestaña **Productos**
4. Crea un nuevo producto o edita uno existente

### 2. Carga de Imagen
#### Opción A: Selección de Archivo
1. Haz clic en el área de carga de imagen
2. Selecciona una imagen desde tu ordenador
3. La imagen se subirá automáticamente

#### Opción B: Arrastrar y Soltar
1. Arrastra una imagen desde tu ordenador
2. Suelta sobre el área de carga
3. La imagen se subirá automáticamente

### 3. Gestión de Imágenes
- **Cambiar imagen**: Haz clic en "Cambiar" en el overlay de la imagen
- **Eliminar imagen**: Haz clic en "Eliminar" en el overlay de la imagen
- **Vista previa**: La imagen se muestra inmediatamente después de la carga

## 🛠️ Configuración Técnica

### Requisitos de Supabase
```sql
-- Verificar que el bucket existe
SELECT * FROM storage.buckets WHERE name = 'product-images';

-- Verificar políticas de acceso público
SELECT * FROM storage.policies WHERE bucket_id = 'product-images';
```

### Estructura de Archivos
```
product-images/
├── products/
│   ├── {product-id-1}/
│   │   ├── 1703123456789-abc123.jpg
│   │   └── 1703123456790-def456.png
│   └── {product-id-2}/
│       └── 1703123456791-ghi789.webp
```

### Componentes Utilizados
- `ImageUpload`: Componente principal de carga
- `uploadProductImage`: Función de subida a Supabase
- `deleteFile`: Función de eliminación de archivos
- `validateFile`: Validación de archivos

## 🔍 Solución de Problemas

### Error: "Tipo de archivo no permitido"
**Causa**: El archivo no es JPG, PNG o WEBP
**Solución**: Convertir la imagen a un formato soportado

### Error: "El archivo es demasiado grande"
**Causa**: El archivo supera los 5MB
**Solución**: Comprimir la imagen o reducir su resolución

### Error: "Usuario no autenticado"
**Causa**: La sesión de administrador expiró
**Solución**: Volver a iniciar sesión

### Error: "Error al subir archivo"
**Causa**: Problema de conectividad o configuración
**Solución**: 
1. Verificar conexión a internet
2. Verificar configuración de Supabase
3. Revisar políticas del bucket

### Imagen no se muestra en la tabla
**Causa**: URL incorrecta o archivo eliminado
**Solución**: 
1. Verificar que la URL sea accesible
2. Recargar la imagen si es necesario

## 📊 Monitoreo y Mantenimiento

### Verificar Estado del Storage
```javascript
// Script de verificación
node scripts/test-storage.js
```

### Limpiar Archivos Temporales
```sql
-- Eliminar archivos en carpeta temp
DELETE FROM storage.objects 
WHERE bucket_id = 'product-images' 
AND name LIKE 'temp/%';
```

### Estadísticas de Uso
```sql
-- Contar productos con imágenes
SELECT 
  COUNT(*) as total_products,
  COUNT(image_url) as products_with_images,
  ROUND(COUNT(image_url) * 100.0 / COUNT(*), 2) as percentage_with_images
FROM products;
```

## 🔒 Seguridad

### Validaciones Implementadas
- ✅ Tipo MIME verificado
- ✅ Tamaño máximo controlado
- ✅ Autenticación requerida
- ✅ Nombres de archivo únicos
- ✅ Organización por producto

### Políticas de Supabase
```sql
-- Política para permitir subida de imágenes
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Política para permitir lectura pública
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

## 🎨 Personalización

### Modificar Límites
```typescript
// En components/ui/image-upload.tsx
const maxSize = 10 * 1024 * 1024; // Cambiar a 10MB
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']; // Agregar GIF
```

### Cambiar Bucket
```typescript
// En services/supabase/storage.ts
const config: StorageConfig = {
  ...DEFAULT_CONFIG,
  bucket: 'mi-nuevo-bucket',
  folder: 'productos'
};
```

## 📈 Mejoras Futuras

### Funcionalidades Planificadas
- [ ] Múltiples imágenes por producto
- [ ] Redimensionamiento automático
- [ ] Optimización de imágenes
- [ ] Galería de imágenes
- [ ] Drag & drop para reordenar
- [ ] Vista previa en diferentes tamaños

### Optimizaciones Técnicas
- [ ] Lazy loading de imágenes
- [ ] Cache de imágenes
- [ ] CDN para distribución
- [ ] Compresión automática
- [ ] Formatos modernos (AVIF, WebP)

## 📞 Soporte

Si encuentras problemas con la funcionalidad:

1. **Revisa los logs** del navegador (F12 → Console)
2. **Verifica la configuración** de Supabase
3. **Prueba con una imagen diferente**
4. **Contacta al equipo de desarrollo**

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0 