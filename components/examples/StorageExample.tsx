import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ImageUpload, 
  ProductImageUpload, 
  CategoryImageUpload, 
  PaymentProofUpload 
} from '@/components/ui/image-upload';
import { useStorage } from '@/hooks/useStorage';
import { 
  uploadProductImage, 
  uploadCategoryImage, 
  uploadPaymentProof,
  deleteFile,
  getPublicUrl 
} from '@/services/supabase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Tag, 
  CreditCard, 
  Upload, 
  Trash2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const StorageExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('components');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { 
    uploadFile, 
    uploadProductImage: uploadProduct, 
    uploadCategoryImage: uploadCategory,
    uploadPaymentProof: uploadPayment,
    deleteFile: deleteFileHook,
    isUploading,
    isDeleting
  } = useStorage();

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================

  const handleComponentUpload = (urls: string[]) => {
    setUploadedUrls(urls);
  };

  const handleManualUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const results = [];
    for (const file of Array.from(files)) {
      try {
        const result = await uploadFile(file);
        results.push({ file: file.name, ...result });
      } catch (error) {
        results.push({ 
          file: file.name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }
    
    setUploadResults(results);
    
    // Limpiar input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleProductUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const results = [];
    for (const file of Array.from(files)) {
      try {
        const result = await uploadProduct(file, 'ejemplo-producto-123');
        results.push({ file: file.name, ...result });
      } catch (error) {
        results.push({ 
          file: file.name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }
    
    setUploadResults(results);
    
    // Limpiar input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCategoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const results = [];
    for (const file of Array.from(files)) {
      try {
        const result = await uploadCategory(file, 'ejemplo-categoria-456');
        results.push({ file: file.name, ...result });
      } catch (error) {
        results.push({ 
          file: file.name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }
    
    setUploadResults(results);
    
    // Limpiar input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handlePaymentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      alert('Debes estar autenticado para subir comprobantes de pago');
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    const results = [];
    for (const file of Array.from(files)) {
      try {
        const result = await uploadPayment(file, user.id);
        results.push({ file: file.name, ...result });
      } catch (error) {
        results.push({ 
          file: file.name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }
    
    setUploadResults(results);
    
    // Limpiar input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (filePath: string, bucket: string) => {
    try {
      const result = await deleteFileHook(filePath, bucket);
      if (result) {
        alert('Archivo eliminado exitosamente');
      } else {
        alert('Error al eliminar el archivo');
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ejemplos de Subida de Imágenes</h2>
        <Badge variant={isUploading ? "default" : "secondary"}>
          {isUploading ? "Subiendo..." : "Listo"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Componentes
          </TabsTrigger>
          <TabsTrigger value="hooks" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Hooks
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Servicios
          </TabsTrigger>
        </TabsList>

        {/* TAB: COMPONENTES REUTILIZABLES */}
        <TabsContent value="components" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Estos son componentes reutilizables que manejan toda la lógica de subida automáticamente.
            </AlertDescription>
          </Alert>

          {/* Componente genérico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Componente Genérico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="product-images"
                folder="ejemplos"
                maxFiles={3}
                label="Subir imágenes genéricas"
                placeholder="Arrastra o selecciona imágenes..."
                onChange={handleComponentUpload}
                onUpload={(result) => console.log('Upload result:', result)}
              />
            </CardContent>
          </Card>

          {/* Componente de producto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Componente de Producto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageUpload
                productId="ejemplo-producto-123"
                label="Imágenes del producto"
                placeholder="Arrastra o selecciona imágenes del producto..."
                onChange={handleComponentUpload}
              />
            </CardContent>
          </Card>

          {/* Componente de categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Componente de Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryImageUpload
                categoryId="ejemplo-categoria-456"
                label="Imagen de la categoría"
                placeholder="Arrastra o selecciona una imagen..."
                onChange={handleComponentUpload}
              />
            </CardContent>
          </Card>

          {/* Componente de comprobante de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Componente de Comprobante
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <PaymentProofUpload
                  userId={user.id}
                  label="Comprobante de pago"
                  placeholder="Arrastra o selecciona el comprobante..."
                  onChange={handleComponentUpload}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Debes estar autenticado para subir comprobantes de pago.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* URLs subidas */}
          {uploadedUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>URLs Subidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: HOOKS PERSONALIZADOS */}
        <TabsContent value="hooks" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Estos ejemplos muestran cómo usar los hooks personalizados para subida manual.
            </AlertDescription>
          </Alert>

          {/* Subida manual genérica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subida Manual Genérica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleManualUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>
              
              {uploadResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Resultados:</h4>
                  {uploadResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{result.file}</span>
                      {result.success ? (
                        <Badge variant="default" className="text-xs">Exitoso</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          {result.error}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subida de producto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Subida de Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleProductUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Los archivos se subirán a la carpeta "ejemplo-producto-123" en el bucket "product-images"
              </p>
            </CardContent>
          </Card>

          {/* Subida de categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Subida de Categoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Los archivos se subirán a la carpeta "ejemplo-categoria-456" en el bucket "category-images"
              </p>
            </CardContent>
          </Card>

          {/* Subida de comprobante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subida de Comprobante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handlePaymentUpload}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Los archivos se subirán a la carpeta "{user.id}" en el bucket "payment-proofs"
                  </p>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Debes estar autenticado para subir comprobantes de pago.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SERVICIOS DIRECTOS */}
        <TabsContent value="services" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Estos ejemplos muestran cómo usar directamente los servicios de storage.
            </AlertDescription>
          </Alert>

          {/* Información del usuario */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-2">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Autenticado:</strong> Sí</p>
                </div>
              ) : (
                <p>No autenticado</p>
              )}
            </CardContent>
          </Card>

          {/* Funciones de utilidad */}
          <Card>
            <CardHeader>
              <CardTitle>Funciones de Utilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Obtener URL pública:</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ruta del archivo (ej: producto/123.jpg)"
                    className="flex-1 px-3 py-2 border rounded"
                    id="filePathInput"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('filePathInput') as HTMLInputElement;
                      const path = input.value;
                      if (path) {
                        const url = getPublicUrl(path, 'product-images');
                        alert(`URL pública: ${url}`);
                      }
                    }}
                  >
                    Obtener URL
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Eliminar archivo:</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ruta del archivo a eliminar"
                    className="flex-1 px-3 py-2 border rounded"
                    id="deletePathInput"
                  />
                  <select className="px-3 py-2 border rounded" id="bucketSelect">
                    <option value="product-images">product-images</option>
                    <option value="category-images">category-images</option>
                    <option value="payment-proofs">payment-proofs</option>
                  </select>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const input = document.getElementById('deletePathInput') as HTMLInputElement;
                      const select = document.getElementById('bucketSelect') as HTMLSelectElement;
                      const path = input.value;
                      const bucket = select.value;
                      if (path) {
                        handleDeleteFile(path, bucket);
                      }
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 