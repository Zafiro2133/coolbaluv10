import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/utils';
import { cloudinaryConfig, cloudinaryUploadUrl, validateImageFile } from '@/config/cloudinary';

interface CloudinaryImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  className?: string;
  disabled?: boolean;
}

export function CloudinaryImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  className,
  disabled = false
}: CloudinaryImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Función para subir imagen a Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', cloudinaryConfig.folder);
    formData.append('api_key', cloudinaryConfig.apiKey);

    const response = await fetch(cloudinaryUploadUrl, { 
      method: 'POST', 
      body: formData 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al subir imagen');
    }

    const data = await response.json();
    return data.secure_url;
  };

  // Función para manejar la selección de archivo
  const handleFileSelect = useCallback(async (file: File) => {
    // Validaciones usando la configuración centralizada
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Limpiar errores previos
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Crear preview inmediato
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      console.log('🚀 Subiendo imagen a Cloudinary:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Subir a Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('✅ Imagen subida exitosamente:', imageUrl);

      setPreviewUrl(imageUrl);
      onImageUploaded(imageUrl);
      
      toast({
        title: "Imagen subida exitosamente",
        description: "La imagen del producto ha sido actualizada.",
      });

    } catch (error) {
      console.error('Error al subir imagen:', error);
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
      setPreviewUrl(currentImageUrl);
      
      toast({
        title: "Error al subir imagen",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [currentImageUrl, onImageUploaded, toast]);

  // Función para manejar el drop de archivos
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, isUploading, handleFileSelect]);

  // Función para manejar el drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Función para eliminar imagen
  const handleRemoveImage = useCallback(() => {
    if (disabled || isUploading) return;

    setPreviewUrl(null);
    onImageRemoved?.();
    
    toast({
      title: "Imagen eliminada",
      description: "La imagen del producto ha sido eliminada.",
    });
  }, [disabled, isUploading, onImageRemoved, toast]);

  // Función para abrir selector de archivos
  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        className="hidden"
      />

      {/* Área de carga */}
      <Card
        className={cn(
          "relative border-2 border-dashed transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/50",
          isUploading && "pointer-events-none opacity-75",
          disabled && "pointer-events-none opacity-50",
          error && "border-destructive/50 bg-destructive/5",
          previewUrl && "border-primary/30"
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="p-6">
          {previewUrl ? (
            // Vista previa de imagen
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Vista previa del producto"
                className="w-full h-48 object-cover rounded-lg"
              />
              
              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  disabled={disabled || isUploading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  disabled={disabled || isUploading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>

              {/* Indicador de estado */}
              {isUploading && (
                <div className="absolute top-2 right-2 bg-background/90 rounded-full p-1">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          ) : (
            // Área de dropzone
            <div className="text-center space-y-4">
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Subiendo imagen...</p>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-destructive">Error al subir imagen</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {currentImageUrl ? 'Cambiar imagen del producto' : 'Agregar imagen del producto'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP • Máximo 5MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mx-auto"
                    disabled={disabled}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar imagen
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      {previewUrl && !isUploading && !error && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>Imagen cargada correctamente</span>
        </div>
      )}
    </div>
  );
} 