import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { validatePaymentProofFile, uploadPaymentProofToCloudinary } from '@/config/cloudinary';

interface PaymentProofUploadProps {
  reservationId: string;
  userId: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  existingProofUrl?: string;
  disabled?: boolean;
  autoConfirmOnUpload?: boolean; // Nueva prop para confirmación automática
  onAutoConfirm?: (url: string) => Promise<void>; // Función para confirmar automáticamente
}

export function PaymentProofUpload({
  reservationId,
  userId,
  onUploadSuccess,
  onUploadError,
  existingProofUrl,
  disabled = false,
  autoConfirmOnUpload = false, // Por defecto false para mantener compatibilidad
  onAutoConfirm
}: PaymentProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingProofUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Debug: Log del archivo para identificar el problema
    console.log('🔍 Archivo seleccionado:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      extension: file.name.split('.').pop()?.toLowerCase()
    });

    // Validar archivo usando Cloudinary
    const validationError = validatePaymentProofFile(file);
    if (validationError) {
      toast({
        title: "Archivo no válido",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadError(null); // Limpiar errores previos
    
    try {
      console.log('🚀 Subiendo comprobante a Cloudinary:', {
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
        userId: userId
      });

      const imageUrl = await uploadPaymentProofToCloudinary(uploadedFile, userId);
      
      console.log('✅ Comprobante subido exitosamente:', imageUrl);
      
      setPreviewUrl(imageUrl);
      onUploadSuccess(imageUrl);

      // Confirmación automática si está habilitada
      if (autoConfirmOnUpload && onAutoConfirm) {
        setIsConfirming(true);
        try {
          await onAutoConfirm(imageUrl);
          toast({
            title: "Reserva confirmada automáticamente",
            description: "La reserva ha sido confirmada automáticamente al subir el comprobante. El cliente puede ver el comprobante de pago en su perfil.",
          });
        } catch (error) {
          console.error('❌ Error al confirmar automáticamente:', error);
          const confirmError = error instanceof Error ? error.message : 'Error desconocido al confirmar';
          onUploadError(confirmError);
          toast({
            title: "Error al confirmar reserva",
            description: confirmError,
            variant: "destructive",
          });
        } finally {
          setIsConfirming(false);
        }
      }
    } catch (error) {
      console.error('❌ Error al subir comprobante:', error);
      let errorMessage = 'Error desconocido al subir el archivo';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      onUploadError(errorMessage);
      toast({
        title: "Error al subir archivo",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (previewUrl && !existingProofUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(existingProofUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) {
      return 'Imagen';
    }
    return 'PDF';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Comprobante de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Archivo existente */}
        {existingProofUrl && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Ya existe un comprobante subido para esta reserva.
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(existingProofUrl, '_blank')}
                  className="mr-2"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Ver comprobante
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Subida de archivo */}
        <div className="space-y-2">
          <Label htmlFor={`payment-proof-${reservationId}`}>Seleccionar archivo</Label>
          <Input
            id={`payment-proof-${reservationId}`}
            name={`payment-proof-${reservationId}`}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileSelect}
            ref={fileInputRef}
            disabled={disabled || isUploading}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Formatos permitidos: JPG, PNG, WebP, PDF. Tamaño máximo: 10MB (Cloudinary)
          </p>
        </div>

        {/* Preview del archivo seleccionado */}
        {uploadedFile && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getFileIcon(uploadedFile)}
                <div>
                  <p className="font-medium text-sm">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getFileTypeLabel(uploadedFile)} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview de imagen */}
            {uploadedFile.type.startsWith('image/') && previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-w-xs h-auto rounded-lg border"
                />
              </div>
            )}

            {/* Botón de subida */}
            <Button
              onClick={handleUpload}
              disabled={isUploading || isConfirming || disabled}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Subiendo...
                </>
              ) : isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Confirmando reserva...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {autoConfirmOnUpload ? 'Subir y Confirmar' : 'Subir Comprobante'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Preview del archivo existente */}
        {existingProofUrl && !uploadedFile && (
          <div className="space-y-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Comprobante subido
            </Badge>
            {existingProofUrl.match(/\.(jpg|jpeg|png|webp)$/i) && (
              <div className="relative">
                <img
                  src={existingProofUrl}
                  alt="Comprobante existente"
                  className="w-full max-w-xs h-auto rounded-lg border"
                />
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Solo se aceptan comprobantes de pago válidos.
            El archivo debe ser legible y mostrar claramente los detalles de la transacción.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 