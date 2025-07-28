import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { 
  uploadFile, 
  uploadMultipleFiles, 
  uploadProductImage, 
  uploadCategoryImage, 
  uploadPaymentProof,
  deleteFile,
  deleteMultipleFiles,
  type UploadResult,
  type StorageConfig
} from '@/services/supabase/storage';

// ============================================================================
// HOOKS DE SUBIDA DE ARCHIVOS
// ============================================================================

export const useFileUpload = (config?: StorageConfig) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await uploadFile(file, config);
      
      if (result.success) {
        setUploadProgress(100);
        toast({
          title: "Archivo subido",
          description: "El archivo se ha subido exitosamente.",
        });
      } else {
        toast({
          title: "Error al subir",
          description: result.error || "No se pudo subir el archivo.",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al subir el archivo.",
        variant: "destructive",
      });
      return {
        url: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [config, toast]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const results = await uploadMultipleFiles(files, config);
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;
      
      if (errorCount === 0) {
        toast({
          title: "Archivos subidos",
          description: `Se subieron ${successCount} archivos exitosamente.`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Subida parcial",
          description: `Se subieron ${successCount} archivos, ${errorCount} fallaron.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al subir",
          description: "No se pudo subir ningún archivo.",
          variant: "destructive",
        });
      }
      
      return results;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al subir los archivos.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [config, toast]);

  return {
    upload,
    uploadMultiple,
    isUploading,
    uploadProgress
  };
};

// ============================================================================
// HOOKS ESPECÍFICOS PARA IMÁGENES
// ============================================================================

export const useProductImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const upload = useCallback(async (file: File, productId?: string): Promise<UploadResult> => {
    setIsUploading(true);
    
    try {
      const result = await uploadProductImage(file, productId);
      
      if (result.success) {
        toast({
          title: "Imagen subida",
          description: "La imagen del producto se ha subido exitosamente.",
        });
      } else {
        toast({
          title: "Error al subir imagen",
          description: result.error || "No se pudo subir la imagen del producto.",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al subir la imagen.",
        variant: "destructive",
      });
      return {
        url: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  return {
    upload,
    isUploading
  };
};

export const useCategoryImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const upload = useCallback(async (file: File, categoryId?: string): Promise<UploadResult> => {
    setIsUploading(true);
    
    try {
      const result = await uploadCategoryImage(file, categoryId);
      
      if (result.success) {
        toast({
          title: "Imagen subida",
          description: "La imagen de la categoría se ha subido exitosamente.",
        });
      } else {
        toast({
          title: "Error al subir imagen",
          description: result.error || "No se pudo subir la imagen de la categoría.",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al subir la imagen.",
        variant: "destructive",
      });
      return {
        url: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  return {
    upload,
    isUploading
  };
};

export const usePaymentProofUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const upload = useCallback(async (file: File, userId: string): Promise<UploadResult> => {
    setIsUploading(true);
    
    try {
      const result = await uploadPaymentProof(file, userId);
      
      if (result.success) {
        toast({
          title: "Comprobante subido",
          description: "El comprobante de pago se ha subido exitosamente.",
        });
      } else {
        toast({
          title: "Error al subir comprobante",
          description: result.error || "No se pudo subir el comprobante de pago.",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al subir el comprobante.",
        variant: "destructive",
      });
      return {
        url: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  return {
    upload,
    isUploading
  };
};

// ============================================================================
// HOOKS DE ELIMINACIÓN
// ============================================================================

export const useFileDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteSingle = useCallback(async (filePath: string, bucket?: string): Promise<boolean> => {
    setIsDeleting(true);
    
    try {
      const result = await deleteFile(filePath, bucket);
      
      if (result.success) {
        toast({
          title: "Archivo eliminado",
          description: "El archivo se ha eliminado exitosamente.",
        });
      } else {
        toast({
          title: "Error al eliminar",
          description: result.error || "No se pudo eliminar el archivo.",
          variant: "destructive",
        });
      }
      
      return result.success;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al eliminar el archivo.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  const deleteMultiple = useCallback(async (filePaths: string[], bucket?: string): Promise<boolean> => {
    setIsDeleting(true);
    
    try {
      const result = await deleteMultipleFiles(filePaths, bucket);
      
      if (result.success) {
        toast({
          title: "Archivos eliminados",
          description: `Se eliminaron ${filePaths.length} archivos exitosamente.`,
        });
      } else {
        toast({
          title: "Error al eliminar",
          description: result.error || "No se pudieron eliminar los archivos.",
          variant: "destructive",
        });
      }
      
      return result.success;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al eliminar los archivos.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  return {
    deleteFile: deleteSingle,
    deleteMultipleFiles: deleteMultiple,
    isDeleting
  };
};

// ============================================================================
// HOOK COMPUESTO PARA GESTIÓN COMPLETA
// ============================================================================

export const useStorage = () => {
  const fileUpload = useFileUpload();
  const productImageUpload = useProductImageUpload();
  const categoryImageUpload = useCategoryImageUpload();
  const paymentProofUpload = usePaymentProofUpload();
  const fileDelete = useFileDelete();

  return {
    // Subida de archivos general
    uploadFile: fileUpload.upload,
    uploadMultipleFiles: fileUpload.uploadMultiple,
    isUploading: fileUpload.isUploading,
    uploadProgress: fileUpload.uploadProgress,
    
    // Subida específica de imágenes
    uploadProductImage: productImageUpload.upload,
    uploadCategoryImage: categoryImageUpload.upload,
    uploadPaymentProof: paymentProofUpload.upload,
    isUploadingImage: productImageUpload.isUploading || categoryImageUpload.isUploading || paymentProofUpload.isUploading,
    
    // Eliminación
    deleteFile: fileDelete.deleteFile,
    deleteMultipleFiles: fileDelete.deleteMultipleFiles,
    isDeleting: fileDelete.isDeleting,
    
    // Estado general
    isLoading: fileUpload.isUploading || productImageUpload.isUploading || 
               categoryImageUpload.isUploading || paymentProofUpload.isUploading || 
               fileDelete.isDeleting
  };
}; 