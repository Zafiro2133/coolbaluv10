// Configuración de Cloudinary
export const cloudinaryConfig = {
  cloudName: 'coolbaluv10',
  apiKey: '428128483696796',
  uploadPreset: 'coolbaluv10_products',
  folder: 'products',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// Configuración específica para comprobantes de pago
export const cloudinaryPaymentProofConfig = {
  cloudName: 'coolbaluv10',
  apiKey: '428128483696796',
  uploadPreset: 'coolbaluv10_products', // Usar el mismo preset
  folder: 'payment-proofs',
  maxFileSize: 10 * 1024 * 1024, // 10MB para comprobantes
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
};

// URL base para subidas
export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

// Función para obtener URL optimizada
export const getOptimizedImageUrl = (originalUrl: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}) => {
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }

  const { width, height, quality = 'auto', format = 'auto' } = options || {};
  
  let transformations = 'f_auto,q_auto';
  
  if (width && height) {
    transformations += `,w_${width},h_${height},c_fill`;
  } else if (width) {
    transformations += `,w_${width}`;
  } else if (height) {
    transformations += `,h_${height}`;
  }

  if (format !== 'auto') {
    transformations = transformations.replace('f_auto', `f_${format}`);
  }

  if (quality !== 'auto') {
    transformations = transformations.replace('q_auto', `q_${quality}`);
  }

  return originalUrl.replace('/upload/', `/upload/${transformations}/`);
};

// Función para validar archivo
export const validateImageFile = (file: File): string | null => {
  if (!cloudinaryConfig.allowedTypes.includes(file.type)) {
    return `Tipo de archivo no permitido. Tipos permitidos: ${cloudinaryConfig.allowedTypes.join(', ')}`;
  }

  if (file.size > cloudinaryConfig.maxFileSize) {
    const maxSizeMB = cloudinaryConfig.maxFileSize / (1024 * 1024);
    return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
  }

  return null;
};

// Función para validar archivo de comprobante
export const validatePaymentProofFile = (file: File): string | null => {
  if (!cloudinaryPaymentProofConfig.allowedTypes.includes(file.type)) {
    return `Tipo de archivo no permitido. Tipos permitidos: ${cloudinaryPaymentProofConfig.allowedTypes.join(', ')}`;
  }

  if (file.size > cloudinaryPaymentProofConfig.maxFileSize) {
    const maxSizeMB = cloudinaryPaymentProofConfig.maxFileSize / (1024 * 1024);
    return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
  }

  return null;
};

// Función para subir comprobante a Cloudinary
export const uploadPaymentProofToCloudinary = async (file: File, userId: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryPaymentProofConfig.uploadPreset);
    formData.append('folder', `${cloudinaryPaymentProofConfig.folder}/${userId}`);
    formData.append('api_key', cloudinaryPaymentProofConfig.apiKey);

    // Determinar el tipo de recurso basado en la extensión
    const fileName = file.name.toLowerCase();
    let resourceType = 'image';
    if (fileName.endsWith('.pdf')) {
      resourceType = 'raw';
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryPaymentProofConfig.cloudName}/${resourceType}/upload`;

    console.log('🌐 Subiendo a Cloudinary:', {
      url: uploadUrl,
      resourceType,
      fileName: file.name,
      size: file.size,
      userId
    });

    const response = await fetch(uploadUrl, { 
      method: 'POST', 
      body: formData 
    });

    if (!response.ok) {
      let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (parseError) {
        console.warn('⚠️ No se pudo parsear el error de Cloudinary:', parseError);
      }
      
      throw new Error(`Error al subir comprobante: ${errorMessage}`);
    }

    const data = await response.json();
    
    if (!data.secure_url) {
      throw new Error('No se recibió URL del archivo subido');
    }

    console.log('✅ Cloudinary response:', {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format
    });

    return data.secure_url;
  } catch (error) {
    console.error('❌ Error en uploadPaymentProofToCloudinary:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Error desconocido al subir archivo a Cloudinary');
    }
  }
}; 