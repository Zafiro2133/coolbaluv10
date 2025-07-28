import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/services/supabase/client';

// ============================================================================
// UTILIDADES DE UI
// ============================================================================

/**
 * Función para combinar clases de Tailwind CSS de forma segura
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// UTILIDADES DE AUTENTICACIÓN
// ============================================================================

/**
 * Verifica que el usuario esté autenticado y tenga una sesión válida
 */
export const ensureAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw new Error('Error de autenticación');
  }
  
  if (!session) {
    throw new Error('Usuario no autenticado');
  }
  
  return session;
};

/**
 * Verifica que los headers de autenticación estén configurados correctamente
 */
export const verifyAuthHeaders = async () => {
  const session = await ensureAuthenticated();
  
  if (!session.access_token) {
    throw new Error('Token de acceso no disponible');
  }
  
  return session;
};

/**
 * Función wrapper para consultas que requieren autenticación
 */
export const authenticatedQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    await verifyAuthHeaders();
    return await queryFn();
  } catch (error) {
    console.error('Authentication error in query:', error);
    return { data: null, error };
  }
};

// ============================================================================
// VALIDACIÓN DE IMÁGENES
// ============================================================================

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
  aspectRatio?: number;
  fileSize?: number;
}

export interface ImageValidationOptions {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minAspectRatio?: number;
  maxAspectRatio?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

const DEFAULT_IMAGE_OPTIONS: Required<ImageValidationOptions> = {
  minWidth: 100,
  maxWidth: 4000,
  minHeight: 100,
  maxHeight: 4000,
  minAspectRatio: 0.1,
  maxAspectRatio: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

/**
 * Valida las dimensiones de una imagen usando FileReader
 */
export const validateImageDimensions = async (
  file: File, 
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> => {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;
        
        // Validar dimensiones mínimas
        if (width < opts.minWidth || height < opts.minHeight) {
          resolve({
            isValid: false,
            error: `La imagen es demasiado pequeña. Mínimo: ${opts.minWidth}x${opts.minHeight}px`,
            dimensions: { width, height },
            aspectRatio
          });
          return;
        }
        
        // Validar dimensiones máximas
        if (width > opts.maxWidth || height > opts.maxHeight) {
          resolve({
            isValid: false,
            error: `La imagen es demasiado grande. Máximo: ${opts.maxWidth}x${opts.maxHeight}px`,
            dimensions: { width, height },
            aspectRatio
          });
          return;
        }
        
        resolve({
          isValid: true,
          dimensions: { width, height },
          aspectRatio,
          fileSize: file.size
        });
      };
      
      img.onerror = () => {
        resolve({
          isValid: false,
          error: 'El archivo no es una imagen válida'
        });
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Error al leer el archivo'
      });
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Valida el tipo MIME de un archivo
 */
export const validateMimeType = (file: File, allowedTypes: string[] = DEFAULT_IMAGE_OPTIONS.allowedTypes): ImageValidationResult => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const problematicTypes = ['application/json', 'text/plain', 'application/octet-stream'];
  
  if (file.type === '') {
    return { isValid: true };
  }
  
  if (validTypes.includes(file.type)) {
    return { isValid: true };
  }
  
  if (problematicTypes.includes(file.type)) {
    return { isValid: true };
  }
  
  if (file.type.startsWith('image/')) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: `Tipo de archivo no soportado: ${file.type}. Solo se permiten imágenes (JPG, PNG, WebP)`
  };
};

/**
 * Valida el tamaño de un archivo
 */
export const validateFileSize = (file: File, maxSize: number = DEFAULT_IMAGE_OPTIONS.maxFileSize): ImageValidationResult => {
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'El archivo está vacío'
    };
  }
  
  if (file.size > maxSize) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeInMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `El archivo es demasiado grande (${sizeInMB}MB). Tamaño máximo: ${maxSizeInMB}MB`,
      fileSize: file.size
    };
  }
  
  return {
    isValid: true,
    fileSize: file.size
  };
};

/**
 * Valida el nombre de un archivo
 */
export const validateFileName = (file: File): ImageValidationResult => {
  if (!file.name || file.name.trim() === '') {
    return {
      isValid: false,
      error: 'El archivo debe tener un nombre válido'
    };
  }
  
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(file.name)) {
    return {
      isValid: false,
      error: 'El nombre del archivo contiene caracteres no permitidos'
    };
  }
  
  return { isValid: true };
};

/**
 * Valida la extensión de un archivo
 */
export const validateFileExtension = (file: File, allowedExtensions: string[] = ['jpg', 'jpeg', 'png', 'webp']): ImageValidationResult => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (!fileExtension) {
    return {
      isValid: false,
      error: 'El archivo debe tener una extensión válida (JPG, PNG, WebP)'
    };
  }
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Extensión no permitida: ${fileExtension}. Solo se permiten: ${allowedExtensions.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Validación completa de una imagen
 */
export const validateImage = async (
  file: File, 
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> => {
  // 1. Validación básica del objeto File
  if (!file || !(file instanceof File)) {
    return { isValid: false, error: 'Archivo inválido' };
  }
  
  // 2. Validación del nombre
  const nameValidation = validateFileName(file);
  if (!nameValidation.isValid) {
    return nameValidation;
  }
  
  // 3. Validación de extensión
  const extensionValidation = validateFileExtension(file);
  if (!extensionValidation.isValid) {
    return extensionValidation;
  }
  
  // 4. Validación de tamaño
  const sizeValidation = validateFileSize(file, options.maxFileSize);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  // 5. Validación de tipo MIME
  const mimeValidation = validateMimeType(file, options.allowedTypes);
  if (!mimeValidation.isValid) {
    return mimeValidation;
  }
  
  // 6. Validación de dimensiones (opcional)
  if (options.minWidth || options.maxWidth || options.minHeight || options.maxHeight) {
    const dimensionValidation = await validateImageDimensions(file, options);
    if (!dimensionValidation.isValid) {
      return dimensionValidation;
    }
    return dimensionValidation;
  }
  
  return { isValid: true, fileSize: file.size };
};

// ============================================================================
// UTILIDADES GENERALES
// ============================================================================

/**
 * Formatea una fecha para mostrar en la interfaz
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatea un precio para mostrar en la interfaz
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(price);
};

/**
 * Genera un ID único
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function para optimizar llamadas
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Función utilitaria para obtener la URL correcta de una imagen de producto
 * @param imageUrl - La URL de la imagen almacenada en la base de datos
 * @returns La URL completa para acceder a la imagen
 */
export const getProductImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '';
  }

  // Si la URL ya es completa (comienza con http/https), la devolvemos tal como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Si es una URL relativa de Supabase Storage, la construimos correctamente
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
  
  // Si la URL ya incluye el bucket, solo agregamos la URL base
  if (imageUrl.includes('product-images/')) {
    return `${supabaseUrl}/storage/v1/object/public/${imageUrl}`;
  }

  // Si es solo el nombre del archivo, construimos la ruta completa
  return `${supabaseUrl}/storage/v1/object/public/product-images/${imageUrl}`;
};

/**
 * Función para verificar si una URL de imagen es válida y accesible
 * @param imageUrl - La URL de la imagen a verificar
 * @returns Promise<boolean> - true si la imagen es accesible, false en caso contrario
 */
export const isImageUrlValid = async (imageUrl: string): Promise<boolean> => {
  if (!imageUrl) return false;
  
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error verificando URL de imagen:', error);
    return false;
  }
};

/**
 * Función para limpiar URLs de imágenes que contienen 'temp/'
 * @param imageUrl - La URL de la imagen
 * @returns string - URL limpia o cadena vacía si contiene 'temp/'
 */
export const cleanTempImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  
  // Si la URL contiene 'temp/', la consideramos inválida
  if (imageUrl.includes('temp/')) {
    console.warn('URL de imagen contiene carpeta temp/, considerada inválida:', imageUrl);
    return '';
  }
  
  return imageUrl;
};

/**
 * Función utilitaria para obtener la URL correcta de una imagen de categoría
 * @param imageUrl - La URL de la imagen almacenada en la base de datos
 * @returns La URL completa para acceder a la imagen
 */
export const getCategoryImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '';
  }

  // Si la URL ya es completa (comienza con http/https), la devolvemos tal como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Si es una URL relativa de Supabase Storage, la construimos correctamente
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
  
  // Si la URL ya incluye el bucket, solo agregamos la URL base
  if (imageUrl.includes('category-images/')) {
    return `${supabaseUrl}/storage/v1/object/public/${imageUrl}`;
  }

  // Si es solo el nombre del archivo, construimos la ruta completa
  return `${supabaseUrl}/storage/v1/object/public/category-images/${imageUrl}`;
};

// ============================================================================
// FUNCIONES DE DEBUG (solo para desarrollo)
// ============================================================================

/**
 * Función de debug para verificar el estado de autenticación
 */
export const debugAuthStatus = async () => {
  console.log('=== DEBUG AUTH STATUS ===');
  
  try {
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('❌ No session found');
      return;
    }
    
    console.log('✅ Session found');
    console.log('User ID:', session.user.id);
    console.log('User email:', session.user.email);
    console.log('Access token exists:', !!session.access_token);
    console.log('Token expires at:', session.expires_at);
    
    // Verificar si el token está expirado
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.warn('⚠️ Token expired');
    } else {
      console.log('✅ Token is valid');
    }
    
    // Intentar hacer una consulta simple para verificar permisos
    console.log('=== TESTING USER_ROLES QUERY ===');
    
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id);
    
    if (userRolesError) {
      console.error('❌ Error querying user_roles:', userRolesError);
      console.error('Error code:', userRolesError.code);
      console.error('Error message:', userRolesError.message);
      console.error('Error details:', userRolesError.details);
    } else {
      console.log('✅ user_roles query successful');
      console.log('User roles found:', userRoles?.length || 0);
      if (userRoles && userRoles.length > 0) {
        console.log('Roles:', userRoles.map(r => r.role));
      }
    }
    
    // Verificar si es admin usando una consulta directa
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('❌ Error checking admin role:', adminError);
    } else {
      console.log('✅ Admin check successful');
      console.log('Is admin:', adminRoles && adminRoles.length > 0);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in debug:', error);
  }
  
  console.log('=== END DEBUG ===');
};

/**
 * Función para verificar headers de la petición
 */
export const debugRequestHeaders = async () => {
  console.log('=== DEBUG REQUEST HEADERS ===');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ No session available');
      return;
    }
    
    // Usar las variables de entorno para la URL y key
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    
    // Crear una petición manual para verificar headers
    const response = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=*&user_id=eq.${session.user.id}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
    } else {
      const data = await response.json();
      console.log('✅ Response successful');
      console.log('Data:', data);
    }
    
  } catch (error) {
    console.error('❌ Error in header debug:', error);
  }
  
  console.log('=== END HEADER DEBUG ===');
}; 