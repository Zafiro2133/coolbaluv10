# Guía de Subida de Imágenes con Supabase Storage

Esta guía explica cómo usar el nuevo sistema de subida de imágenes implementado con Supabase Storage JS Client.

## 📋 Tabla de Contenidos

1. [Configuración](#configuración)
2. [Servicios](#servicios)
3. [Hooks](#hooks)
4. [Componentes](#componentes)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Solución de Problemas](#solución-de-problemas)

## ⚙️ Configuración

### Variables de Entorno

Asegúrate de tener configuradas las siguientes variables de entorno:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Buckets de Storage

El sistema está configurado para usar los siguientes buckets:

- `product-images`: Para imágenes de productos
- `category-images`: Para imágenes de categorías  
- `payment-proofs`: Para comprobantes de pago

## 🔧 Servicios

### Servicio Principal: `services/supabase/storage.ts`

Este servicio proporciona todas las funciones necesarias para gestionar archivos en Supabase Storage usando **Standard Upload**, el método recomendado para archivos menores a 6MB.

#### Funciones Principales

```typescript
// Subida de archivos
uploadFile(file: File, config?: StorageConfig): Promise<UploadResult>
uploadMultipleFiles(files: File[], config?: StorageConfig): Promise<UploadResult[]>

// Subida específica
uploadProductImage(file: File, productId?: string): Promise<UploadResult>
uploadCategoryImage(file: File, categoryId?: string): Promise<UploadResult>
uploadPaymentProof(file: File, userId: string): Promise<UploadResult>

// Eliminación
deleteFile(filePath: string, bucket?: string): Promise<{ success: boolean; error?: string }>
deleteMultipleFiles(filePaths: string[], bucket?: string): Promise<{ success: boolean; error?: string }>

// Utilidades
getPublicUrl(filePath: string, bucket?: string): string
isImageUrlValid(url: string): Promise<boolean>
listFiles(bucket?: string, folder?: string): Promise<{ data: any[] | null; error: any }>
```

#### Configuración por Defecto

```typescript
const DEFAULT_CONFIG: StorageConfig = {
  bucket: 'product-images',
  maxFileSize: 5 * 1024 * 1024, // 5MB (dentro del límite de Standard Upload)
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};
```

#### Método de Subida: Standard Upload

Este sistema utiliza **Standard Upload** de Supabase Storage, que es:

- **Recomendado para archivos < 6MB**
- **Detección automática del tipo MIME** basada en la extensión del archivo
- **Más simple y directo** que otros métodos
- **Ideal para la mayoría de casos de uso** de imágenes web

**Ventajas:**
- No requiere especificar `contentType` manualmente
- Supabase detecta automáticamente el tipo de archivo
- Menor complejidad en la implementación
- Mejor rendimiento para archivos pequeños

## 🎣 Hooks

### Hook Principal: `hooks/useStorage.ts`

Proporciona hooks personalizados para facilitar el uso del servicio de storage.

#### Hooks Disponibles

```typescript
// Hook general
useFileUpload(config?: StorageConfig)

// Hooks específicos
useProductImageUpload()
useCategoryImageUpload()
usePaymentProofUpload()

// Hook de eliminación
useFileDelete()

// Hook compuesto
useStorage()
```

#### Ejemplo de Uso

```typescript
import { useStorage } from '@/hooks/useStorage';

function MyComponent() {
  const { 
    uploadFile, 
    uploadProductImage, 
    isUploading, 
    deleteFile 
  } = useStorage();

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file);
    if (result.success) {
      console.log('Archivo subido:', result.url);
    }
  };

  return (
    <div>
      {isUploading && <p>Subiendo archivo...</p>}
      {/* Tu UI aquí */}
    </div>
  );
}
```

## 🧩 Componentes

### Componente Principal: `components/ui/image-upload.tsx`

Componente reutilizable para la subida de imágenes con drag & drop, validación y preview.

#### Componentes Disponibles

```typescript
// Componente genérico
<ImageUpload 
  bucket="product-images"
  folder="mi-carpeta"
  maxFiles={5}
  onChange={(urls) => console.log(urls)}
/>

// Componentes especializados
<ProductImageUpload productId="123" />
<CategoryImageUpload categoryId="456" />
<PaymentProofUpload userId="user-123" />
```

#### Props del Componente

```typescript
interface ImageUploadProps {
  // Configuración básica
  bucket?: 'product-images' | 'category-images' | 'payment-proofs';
  folder?: string;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  
  // Estados
  value?: string[];
  onChange?: (urls: string[]) => void;
  onUpload?: (result: { url: string; path: string; success: boolean }) => void;
  
  // UI
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  
  // Validación
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minAspectRatio?: number;
  maxAspectRatio?: number;
}
```

## 📝 Ejemplos de Uso

### 1. Subida Simple de Imagen de Producto

```typescript
import { ProductImageUpload } from '@/components/ui/image-upload';

function ProductForm({ productId }: { productId: string }) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  return (
    <ProductImageUpload
      productId={productId}
      value={imageUrls}
      onChange={setImageUrls}
      onUpload={(result) => {
        if (result.success) {
          console.log('Imagen subida:', result.url);
        }
      }}
    />
  );
}
```

### 2. Subida Manual con Hook

```typescript
import { useProductImageUpload } from '@/hooks/useStorage';

function ManualUpload() {
  const { upload, isUploading } = useProductImageUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await upload(file, 'product-123');
      if (result.success) {
        console.log('URL de la imagen:', result.url);
      }
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      {isUploading && <p>Subiendo imagen...</p>}
    </div>
  );
}
```

### 3. Subida Múltiple con Servicio Directo

```typescript
import { uploadMultipleFiles } from '@/services/supabase/storage';

function BulkUpload() {
  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const results = await uploadMultipleFiles(fileArray);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`${successful.length} archivos subidos exitosamente`);
    console.log(`${failed.length} archivos fallaron`);
  };

  return (
    <input 
      type="file" 
      multiple 
      accept="image/*" 
      onChange={(e) => e.target.files && handleFiles(e.target.files)}
    />
  );
}
```

### 4. Gestión de Archivos

```typescript
import { useStorage } from '@/hooks/useStorage';

function FileManager() {
  const { deleteFile, listFiles } = useStorage();

  const handleDelete = async (filePath: string) => {
    const result = await deleteFile(filePath, 'product-images');
    if (result.success) {
      console.log('Archivo eliminado');
    } else {
      console.error('Error:', result.error);
    }
  };

  const handleListFiles = async () => {
    const { data, error } = await listFiles('product-images', 'carpeta');
    if (data) {
      console.log('Archivos:', data);
    }
  };

  return (
    <div>
      <button onClick={handleListFiles}>Listar archivos</button>
      {/* UI para mostrar y eliminar archivos */}
    </div>
  );
}
```

## ✅ Mejores Prácticas

### 1. Validación de Archivos

- Siempre valida el tipo y tamaño de archivo antes de subir
- Usa las funciones de validación incluidas en el servicio
- Considera las dimensiones de imagen para tu caso de uso

### 2. Manejo de Errores

```typescript
const handleUpload = async (file: File) => {
  try {
    const result = await uploadFile(file);
    if (result.success) {
      // Manejar éxito
    } else {
      // Manejar error específico
      console.error('Error de subida:', result.error);
    }
  } catch (error) {
    // Manejar error inesperado
    console.error('Error inesperado:', error);
  }
};
```

### 3. Organización de Archivos

- Usa carpetas específicas para cada entidad (producto, categoría, etc.)
- Incluye IDs únicos en las rutas de archivos
- Considera usar timestamps para evitar conflictos de nombres

### 4. Optimización de Rendimiento

- Usa `showPreview={false}` para archivos grandes
- Implementa lazy loading para múltiples imágenes
- Considera comprimir imágenes antes de subir
- **Mantén archivos bajo 6MB** para usar Standard Upload eficientemente
- **Usa formatos web optimizados** (WebP, JPEG optimizado)

### 5. Seguridad

- Valida tipos de archivo permitidos
- Establece límites de tamaño apropiados
- Usa políticas de RLS en Supabase para controlar acceso

## 🔧 Solución de Problemas

### Error: "Usuario no autenticado"

**Causa:** El usuario no está logueado en Supabase.

**Solución:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  if (!user) {
    return <p>Debes estar autenticado para subir archivos</p>;
  }
  
  // Continuar con la subida
}
```

### Error: "Configuración del storage incorrecta"

**Causa:** El bucket no existe o no está configurado correctamente.

**Solución:**
1. Verifica que el bucket existe en tu proyecto de Supabase
2. Asegúrate de que las políticas RLS están configuradas
3. Verifica que el bucket es público si es necesario

### Error: "Tipo de archivo no permitido"

**Causa:** El archivo no cumple con los tipos permitidos.

**Solución:**
```typescript
// Verificar tipos permitidos
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Validar antes de subir
const validation = await validateImage(file, { allowedTypes });
if (!validation.isValid) {
  console.error('Archivo no válido:', validation.error);
  return;
}
```

### Error: "Archivo demasiado grande"

**Causa:** El archivo excede el límite de tamaño configurado.

**Solución:**
```typescript
// Aumentar límite de tamaño
const config: StorageConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  // ... otras configuraciones
};

// O comprimir la imagen antes de subir
const compressedFile = await compressImage(file);
```

### URLs de Imágenes No Accesibles

**Causa:** Las políticas de storage no están configuradas correctamente.

**Solución:**
1. Verifica que el bucket tiene políticas públicas para lectura
2. Asegúrate de que las URLs se generan correctamente
3. Verifica que los archivos existen en la ruta especificada

### Error: "File too large for Standard Upload"

**Causa:** El archivo excede el límite de 6MB para Standard Upload.

**Solución:**
```typescript
// Comprimir la imagen antes de subir
const compressedFile = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8
});

// O usar un límite más estricto en la validación
const config: StorageConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB para estar seguros
  // ... otras configuraciones
};
```

### Error: "Content type detection failed"

**Causa:** El archivo no tiene una extensión válida o el tipo MIME no se puede detectar.

**Solución:**
```typescript
// Asegúrate de que el archivo tenga una extensión válida
const validateFileExtension = (file: File) => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  return validExtensions.includes(extension || '');
};
```

## 📚 Recursos Adicionales

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS para Storage](https://supabase.com/docs/guides/storage/security)
- [API de Storage de Supabase](https://supabase.com/docs/reference/javascript/storage-createbucket)

## 🤝 Contribución

Para contribuir al sistema de storage:

1. Mantén la consistencia con el código existente
2. Agrega validaciones apropiadas
3. Incluye manejo de errores
4. Documenta nuevas funciones
5. Agrega tests cuando sea posible

---

**Nota:** Este sistema reemplaza la implementación anterior basada en S3 y proporciona una integración más directa con Supabase Storage usando el cliente JS oficial. 