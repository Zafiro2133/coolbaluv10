// Configuración de Cloudinary
export const cloudinaryConfig = {
  cloudName: 'coolbaluv10',
  apiKey: '428128483696796',
  uploadPreset: 'coolbaluv10_products',
  folder: 'products',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
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