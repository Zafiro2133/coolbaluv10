import { supabase } from './client';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface UploadResult {
  url: string;
  path: string;
  success: boolean;
  error?: string;
}

export interface StorageConfig {
  bucket: string;
  folder?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
}

// ============================================================================
// CONFIGURACIONES POR DEFECTO
// ============================================================================

const DEFAULT_CONFIG: StorageConfig = {
  bucket: 'product-images',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Valida un archivo antes de subirlo
 */
export const validateFile = (file: File, config: StorageConfig = DEFAULT_CONFIG): string | null => {
  // Validar extensión del archivo
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  if (!allowedExtensions.includes(fileExtension)) {
    return `Extensión de archivo no permitida: ${fileExtension}. Tipos permitidos: ${allowedExtensions.join(', ')}`;
  }

  // Validar tipo de archivo
  if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
    console.warn('Tipo MIME detectado:', file.type, 'Archivo:', file.name, 'Extensión:', fileExtension);
    return `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${config.allowedTypes.join(', ')}`;
  }

  // Validar tamaño
  if (config.maxFileSize && file.size > config.maxFileSize) {
    const maxSizeMB = config.maxFileSize / (1024 * 1024);
    return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
  }

  return null;
};

/**
 * Genera un nombre de archivo único
 */
export const generateFileName = (file: File, folder?: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  const fileName = `${timestamp}-${randomId}.${extension}`;
  
  if (folder) {
    return `${folder}/${fileName}`;
  }
  
  return fileName;
};

// ============================================================================
// FUNCIONES DE SUBIDA
// ============================================================================

/**
 * Sube un archivo a Supabase Storage
 */
export const uploadFile = async (
  file: File, 
  config: StorageConfig = DEFAULT_CONFIG
): Promise<UploadResult> => {
  try {
    // Validar archivo
    const validationError = validateFile(file, config);
    if (validationError) {
      return {
        url: '',
        path: '',
        success: false,
        error: validationError
      };
    }

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        url: '',
        path: '',
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Generar nombre de archivo
    const fileName = generateFileName(file, config.folder);
    
    console.log('🚀 Subiendo archivo:', {
      name: file.name,
      type: file.type,
      size: file.size,
      bucket: config.bucket,
      path: fileName
    });

    // Subir archivo usando Standard Upload (recomendado para archivos < 6MB)
    const { data, error } = await supabase.storage
      .from(config.bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type // Forzar el tipo MIME correcto
      });

    if (error) {
      console.error('❌ Error al subir archivo:', error);
      return {
        url: '',
        path: '',
        success: false,
        error: `Error al subir archivo: ${error.message}`
      };
    }

    // Generar URL pública
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(fileName);

    console.log('✅ Archivo subido exitosamente:', {
      path: data.path,
      url: urlData.publicUrl
    });

    return {
      url: urlData.publicUrl,
      path: data.path,
      success: true
    };

  } catch (error) {
    console.error('❌ Error inesperado al subir archivo:', error);
    return {
      url: '',
      path: '',
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

/**
 * Sube múltiples archivos a Supabase Storage
 */
export const uploadMultipleFiles = async (
  files: File[], 
  config: StorageConfig = DEFAULT_CONFIG
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadFile(file, config);
    results.push(result);
  }
  
  return results;
};

// ============================================================================
// FUNCIONES DE ELIMINACIÓN
// ============================================================================

/**
 * Elimina un archivo de Supabase Storage
 */
export const deleteFile = async (
  filePath: string, 
  bucket: string = DEFAULT_CONFIG.bucket
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🗑️ Eliminando archivo:', { bucket, path: filePath });

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('❌ Error al eliminar archivo:', error);
      return {
        success: false,
        error: `Error al eliminar archivo: ${error.message}`
      };
    }

    console.log('✅ Archivo eliminado exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error inesperado al eliminar archivo:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

/**
 * Elimina múltiples archivos de Supabase Storage
 */
export const deleteMultipleFiles = async (
  filePaths: string[], 
  bucket: string = DEFAULT_CONFIG.bucket
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🗑️ Eliminando múltiples archivos:', { bucket, paths: filePaths });

    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths);

    if (error) {
      console.error('❌ Error al eliminar archivos:', error);
      return {
        success: false,
        error: `Error al eliminar archivos: ${error.message}`
      };
    }

    console.log('✅ Archivos eliminados exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error inesperado al eliminar archivos:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

// ============================================================================
// FUNCIONES ESPECÍFICAS PARA IMÁGENES
// ============================================================================

/**
 * Sube una imagen de producto
 */
export const uploadProductImage = async (file: File, productId?: string): Promise<UploadResult> => {
  try {
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        url: '',
        path: '',
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Generar nombre de archivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${productId || 'temp'}/${timestamp}-${randomId}.${extension}`;
    
    console.log('🚀 Subiendo imagen:', {
      name: file.name,
      type: file.type,
      size: file.size,
      path: fileName
    });

    // Subir archivo directamente sin validaciones adicionales
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('❌ Error al subir imagen:', error);
      return {
        url: '',
        path: '',
        success: false,
        error: `Error al subir imagen: ${error.message}`
      };
    }

    // Generar URL pública
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('✅ Imagen subida exitosamente:', {
      path: data.path,
      url: urlData.publicUrl
    });

    return {
      url: urlData.publicUrl,
      path: data.path,
      success: true
    };

  } catch (error) {
    console.error('❌ Error inesperado al subir imagen:', error);
    return {
      url: '',
      path: '',
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

/**
 * Sube una imagen de categoría
 */
export const uploadCategoryImage = async (file: File, categoryId?: string): Promise<UploadResult> => {
  const config: StorageConfig = {
    ...DEFAULT_CONFIG,
    bucket: 'category-images',
    folder: categoryId || 'temp'
  };
  
  return uploadFile(file, config);
};

/**
 * Sube una imagen de comprobante de pago
 */
export const uploadPaymentProof = async (file: File, userId: string): Promise<UploadResult> => {
  try {
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        url: '',
        path: '',
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Determinar el tipo MIME correcto basado en la extensión
    const fileName = file.name.toLowerCase();
    let correctMimeType = file.type;
    
    if (fileName.endsWith('.png')) {
      correctMimeType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      correctMimeType = 'image/jpeg';
    } else if (fileName.endsWith('.webp')) {
      correctMimeType = 'image/webp';
    } else if (fileName.endsWith('.pdf')) {
      correctMimeType = 'application/pdf';
    }

    console.log('🔧 Tipo MIME corregido:', {
      original: file.type,
      corrected: correctMimeType,
      fileName: file.name
    });

    // Generar nombre de archivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filePath = `${userId}/${timestamp}-${randomId}.${extension}`;
    
    console.log('🚀 Subiendo comprobante:', {
      name: file.name,
      originalType: file.type,
      correctedType: correctMimeType,
      size: file.size,
      path: filePath
    });

    // Subir archivo con tipo MIME corregido
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: correctMimeType // Forzar el tipo MIME correcto
      });

    if (error) {
      console.error('❌ Error al subir comprobante:', error);
      return {
        url: '',
        path: '',
        success: false,
        error: `Error al subir comprobante: ${error.message}`
      };
    }

    // Generar URL pública
    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath);

    console.log('✅ Comprobante subido exitosamente:', {
      path: data.path,
      url: urlData.publicUrl
    });

    return {
      url: urlData.publicUrl,
      path: data.path,
      success: true
    };

  } catch (error) {
    console.error('❌ Error inesperado al subir comprobante:', error);
    return {
      url: '',
      path: '',
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Verifica si una URL de imagen es accesible
 */
export const isImageUrlValid = async (url: string): Promise<boolean> => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error verificando URL de imagen:', error);
    return false;
  }
};

/**
 * Obtiene la URL pública de un archivo
 */
export const getPublicUrl = (filePath: string, bucket: string = DEFAULT_CONFIG.bucket): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

/**
 * Lista archivos en un bucket
 */
export const listFiles = async (
  bucket: string = DEFAULT_CONFIG.bucket,
  folder?: string
): Promise<{ data: any[] | null; error: any }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '');

    return { data, error };
  } catch (error) {
    console.error('Error listando archivos:', error);
    return { data: null, error };
  }
};

/**
 * Mueve archivos de una carpeta temporal a una carpeta específica
 */
export const moveFilesFromTemp = async (
  tempFiles: string[],
  targetFolder: string,
  bucket: string = DEFAULT_CONFIG.bucket
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Para cada archivo temporal, crear una copia en la carpeta destino
    for (const tempFile of tempFiles) {
      if (tempFile.includes('temp/')) {
        const fileName = tempFile.split('/').pop();
        const newPath = `${targetFolder}/${fileName}`;
        
        // Descargar el archivo temporal
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(tempFile);
          
        if (downloadError) {
          console.error('Error descargando archivo temporal:', downloadError);
          continue;
        }
        
        // Subir a la nueva ubicación usando Standard Upload
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(newPath, downloadData, {
            cacheControl: '3600',
            upsert: true
            // No especificar contentType - Supabase detectará automáticamente el tipo MIME
          });
          
        if (uploadError) {
          console.error('Error subiendo archivo a nueva ubicación:', uploadError);
          continue;
        }
        
        // Eliminar archivo temporal
        await deleteFile(tempFile, bucket);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error moviendo archivos:', error);
    return {
      success: false,
      error: `Error moviendo archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}; 