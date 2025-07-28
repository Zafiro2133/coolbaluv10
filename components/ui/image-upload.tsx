import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/utils';
import { useStorage } from '@/hooks/useStorage';
import { validateImage } from '@/utils';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface ImageUploadProps {
  // Configuración básica
  bucket?: 'product-images' | 'category-images' | 'payment-proofs';
  folder?: string;
  maxFiles?: number;
  maxFileSize?: number; // en bytes
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

export interface ImageFile {
  file: File;
  url: string;
  path: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ImageUpload: React.FC<ImageUploadProps> = ({
  bucket = 'product-images',
  folder,
  maxFiles = 1,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  value = [],
  onChange,
  onUpload,
  label = 'Subir imágenes',
  placeholder = 'Selecciona archivos de imagen...',
  className,
  disabled = false,
  showPreview = true,
  showProgress = true,
  minWidth = 100,
  maxWidth = 4000,
  minHeight = 100,
  maxHeight = 4000,
  minAspectRatio = 0.1,
  maxAspectRatio = 10,
}) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading, uploadProgress } = useStorage();

  // ============================================================================
  // MANEJO DE ARCHIVOS
  // ============================================================================

  const validateAndAddFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImageFiles: ImageFile[] = [];

    for (const file of fileArray) {
      // Validar límite de archivos
      if (imageFiles.length + newImageFiles.length >= maxFiles) {
        break;
      }

      // Validar archivo
      const validation = await validateImage(file, {
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
        minAspectRatio,
        maxAspectRatio,
        maxFileSize,
        allowedTypes,
      });

      if (!validation.isValid) {
        newImageFiles.push({
          file,
          url: '',
          path: '',
          status: 'error',
          error: validation.error,
          preview: URL.createObjectURL(file),
        });
        continue;
      }

      // Crear preview
      const preview = URL.createObjectURL(file);
      
      newImageFiles.push({
        file,
        url: '',
        path: '',
        status: 'uploading',
        preview,
      });
    }

    setImageFiles(prev => [...prev, ...newImageFiles]);
    return newImageFiles;
  }, [imageFiles.length, maxFiles, minWidth, maxWidth, minHeight, maxHeight, minAspectRatio, maxAspectRatio, maxFileSize, allowedTypes]);

  const uploadFiles = useCallback(async (files: ImageFile[]) => {
    const uploadPromises = files.map(async (imageFile) => {
      if (imageFile.status === 'error') return imageFile;

      try {
        const result = await uploadFile(imageFile.file);
        
        return {
          ...imageFile,
          url: result.url,
          path: result.path,
          status: result.success ? 'success' as const : 'error' as const,
          error: result.error,
        };
      } catch (error) {
        return {
          ...imageFile,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Error desconocido',
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    // Actualizar estado
    setImageFiles(prev => 
      prev.map(prevFile => {
        const result = results.find(r => r.file === prevFile.file);
        return result || prevFile;
      })
    );

    // Notificar cambios
    const successfulUploads = results.filter(r => r.status === 'success');
    if (successfulUploads.length > 0) {
      const urls = successfulUploads.map(r => r.url);
      onChange?.(urls);
      
      successfulUploads.forEach(upload => {
        onUpload?.({
          url: upload.url,
          path: upload.path,
          success: true,
        });
      });
    }

    return results;
  }, [uploadFile, onChange, onUpload]);

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = await validateAndAddFiles(files);
    await uploadFiles(newFiles);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateAndAddFiles, uploadFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = await validateAndAddFiles(e.dataTransfer.files);
      await uploadFiles(newFiles);
    }
  }, [validateAndAddFiles, uploadFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setImageFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      const urls = newFiles.filter(f => f.status === 'success').map(f => f.url);
      onChange?.(urls);
      return newFiles;
    });
  }, [onChange]);

  const handleRemoveAll = useCallback(() => {
    setImageFiles([]);
    onChange?.([]);
  }, [onChange]);

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  const renderFilePreview = (imageFile: ImageFile, index: number) => (
    <Card key={index} className="relative overflow-hidden">
      <CardContent className="p-0">
        {showPreview && imageFile.preview && (
          <div className="relative aspect-video">
            <img
              src={imageFile.preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              {imageFile.status === 'uploading' && (
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Subiendo...</p>
                </div>
              )}
              {imageFile.status === 'success' && (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
              {imageFile.status === 'error' && (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>
        )}
        
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium truncate">{imageFile.file.name}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFile(index)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                imageFile.status === 'success' ? 'default' :
                imageFile.status === 'error' ? 'destructive' : 'secondary'
              }
              className="text-xs"
            >
              {imageFile.status === 'uploading' && 'Subiendo...'}
              {imageFile.status === 'success' && 'Completado'}
              {imageFile.status === 'error' && 'Error'}
            </Badge>
            
            <span className="text-xs text-muted-foreground">
              {(imageFile.file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          
          {imageFile.error && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {imageFile.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          {imageFiles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveAll}
              className="text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar todo
            </Button>
          )}
        </div>
      )}

      {/* Área de subida */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {dragActive ? 'Suelta los archivos aquí' : placeholder}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {allowedTypes.join(', ').toUpperCase()} • Máximo {maxFileSize / 1024 / 1024}MB
              {maxFiles > 1 && ` • Hasta ${maxFiles} archivos`}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Seleccionar archivos
          </Button>
        </div>
      </div>

      {/* Barra de progreso */}
      {showProgress && isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subiendo archivos...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Previsualizaciones */}
      {imageFiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {imageFiles.map((imageFile, index) => renderFilePreview(imageFile, index))}
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Formatos soportados: {allowedTypes.join(', ').toUpperCase()}</p>
        <p>• Tamaño máximo: {(maxFileSize / 1024 / 1024).toFixed(1)} MB por archivo</p>
        {maxFiles > 1 && <p>• Máximo {maxFiles} archivos</p>}
        <p>• Dimensiones mínimas: {minWidth}x{minHeight}px</p>
        <p>• Dimensiones máximas: {maxWidth}x{maxHeight}px</p>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTES ESPECIALIZADOS
// ============================================================================

export const ProductImageUpload: React.FC<Omit<ImageUploadProps, 'bucket'> & { productId?: string }> = ({
  productId,
  ...props
}) => {
  return (
    <ImageUpload
      bucket="product-images"
      folder={productId}
      maxFiles={5}
      label="Imágenes del producto"
      placeholder="Arrastra o selecciona imágenes del producto..."
      {...props}
    />
  );
};

export const CategoryImageUpload: React.FC<Omit<ImageUploadProps, 'bucket'> & { categoryId?: string }> = ({
  categoryId,
  ...props
}) => {
  return (
    <ImageUpload
      bucket="category-images"
      folder={categoryId}
      maxFiles={1}
      label="Imagen de la categoría"
      placeholder="Arrastra o selecciona una imagen para la categoría..."
      {...props}
    />
  );
};

export const PaymentProofUpload: React.FC<Omit<ImageUploadProps, 'bucket'> & { userId: string }> = ({
  userId,
  ...props
}) => {
  return (
    <ImageUpload
      bucket="payment-proofs"
      folder={userId}
      maxFiles={1}
      maxFileSize={10 * 1024 * 1024} // 10MB
      allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']}
      label="Comprobante de pago"
      placeholder="Arrastra o selecciona el comprobante de pago..."
      showPreview={false}
      {...props}
    />
  );
}; 