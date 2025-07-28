import { useState, useRef, useEffect } from 'react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useCreateProduct, useUpdateProduct, useDeleteProduct, useDeleteAllProducts, useDuplicateProduct, useCreateCategory, useUpdateCategory } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, Trash2, Image, DollarSign, Tag, Eye, EyeOff, Copy, Upload, X, AlertCircle, Trash } from 'lucide-react';
import { supabase } from '@/services/supabase/client';
// Debug functions removed during cleanup - functionality preserved in main utils

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order?: number;
  image_url?: string;
}

interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  file?: File;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  category_id: string;
  is_active: boolean;
  display_order?: number;
  image_url?: string;
  extra_hour_percentage?: number;
  categories?: Category;
  images?: ProductImage[];
}

export function CatalogManagement() {
  const [activeTab, setActiveTab] = useState('products');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Catálogo</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorías
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductManagement() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { data: products, isLoading } = useAdminProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const deleteAllProductsMutation = useDeleteAllProducts();
  const duplicateProductMutation = useDuplicateProduct();
  const { toast } = useToast();

  const handleCreateProduct = async (productData: any) => {
    try {
      const result = await createProductMutation.mutateAsync(productData);
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente.",
      });
      setIsCreateDialogOpen(false);
      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el producto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    try {
      const result = await updateProductMutation.mutateAsync({
        productId: selectedProduct!.id,
        ...productData,
      });
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente.",
      });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
      await deleteProductMutation.mutateAsync(productId);
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres duplicar este producto?')) return;
    
    try {
      await duplicateProductMutation.mutateAsync(productId);
      toast({
        title: "Producto duplicado",
        description: "El producto ha sido duplicado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo duplicar el producto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!products || products.length === 0) {
      toast({
        title: "No hay productos",
        description: "No hay productos para eliminar.",
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = `¿Estás seguro de que quieres eliminar TODOS los productos (${products.length} productos)?\n\nEsta acción es IRREVERSIBLE y eliminará permanentemente todos los productos del catálogo.`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      await deleteAllProductsMutation.mutateAsync();
      toast({
        title: "Todos los productos eliminados",
        description: `${products.length} productos han sido eliminados exitosamente.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar todos los productos.",
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      await updateProductMutation.mutateAsync({
        productId: product.id,
        is_active: !product.is_active,
      });
      toast({
        title: "Estado actualizado",
        description: `El producto ha sido ${!product.is_active ? 'activado' : 'desactivado'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del producto.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Productos ({products?.length || 0})</CardTitle>
          <div className="flex items-center gap-2">
            {products && products.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteAllProducts}
                disabled={deleteAllProductsMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                {deleteAllProductsMutation.isPending ? 'Eliminando...' : 'Eliminar Todos'}
              </Button>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogDescription className="sr-only"> </DialogDescription>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Producto</DialogTitle>
                  <DialogDescription>
                    Completa los datos para crear un nuevo producto en el catálogo
                  </DialogDescription>
                </DialogHeader>
                <ProductForm onSubmit={handleCreateProduct} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio Base</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <div className="relative">
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          {product.images && product.images.length > 1 && (
                            <Badge 
                              variant="secondary" 
                              className="absolute -top-1 -right-1 text-xs px-1 py-0 min-w-0 w-5 h-5 flex items-center justify-center"
                            >
                              {product.images.length}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-muted-foreground">
                            {product.description.length > 50 
                              ? `${product.description.substring(0, 50)}...`
                              : product.description
                            }
                          </div>
                        )}
                        {product.images && product.images.length > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {product.images.length} imágenes
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.category?.name || 'Sin categoría'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {product.base_price.toLocaleString()}
                    </div>
                    {product.extra_hour_percentage && (
                      <div className="text-xs text-muted-foreground">
                        +{product.extra_hour_percentage}% por hora extra
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProductStatus(product)}
                        disabled={updateProductMutation.isPending}
                      >
                        {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogDescription className="sr-only"> </DialogDescription>
                          <DialogHeader>
                            <DialogTitle>Editar Producto</DialogTitle>
                          </DialogHeader>
                          {selectedProduct && (
                            <ProductForm 
                              product={selectedProduct} 
                              onSubmit={handleUpdateProduct} 
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateProduct(product.id)}
                        disabled={duplicateProductMutation.isPending}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deleteProductMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {products?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay productos registrados.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const { toast } = useToast();

  // Fetch categories
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (!error && data) {
      setCategories(data);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (categoryData: any) => {
    try {
      await createCategoryMutation.mutateAsync(categoryData);
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente.",
      });
      setIsCreateDialogOpen(false);
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (categoryData: any) => {
    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: selectedCategory!.id,
        ...categoryData,
      });
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente.",
      });
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: category.id,
        is_active: !category.is_active,
      });
      toast({
        title: "Estado actualizado",
        description: `La categoría ha sido ${!category.is_active ? 'activada' : 'desactivada'}.`,
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la categoría.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Categorías ({categories.length})</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogDescription className="sr-only"> </DialogDescription>
              <DialogHeader>
                <DialogTitle>Crear Nueva Categoría</DialogTitle>
              </DialogHeader>
              <CategoryForm onSubmit={handleCreateCategory} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              {category.image_url && (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                    <Badge 
                      variant={category.is_active ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {category.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCategoryStatus(category)}
                    disabled={updateCategoryMutation.isPending}
                  >
                    {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogDescription className="sr-only"> </DialogDescription>
                      <DialogHeader>
                        <DialogTitle>Editar Categoría</DialogTitle>
                      </DialogHeader>
                      {selectedCategory && (
                        <CategoryForm 
                          category={selectedCategory} 
                          onSubmit={handleUpdateCategory} 
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay categorías registradas.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Product Form Component
function ProductForm({ 
  product, 
  onSubmit 
}: { 
  product?: Product; 
  onSubmit: (data: any) => Promise<any>; 
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    base_price: product?.base_price || 0,
    category_id: product?.category_id || '',
    extra_hour_percentage: product?.extra_hour_percentage || 15,
    display_order: product?.display_order || 0,
    image_url: product?.image_url || '',
    is_active: product?.is_active ?? true,
  });

  const [productImages, setProductImages] = useState<ProductImage[]>(product?.images || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_IMAGES = 3;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const validateFile = (file: File): string | null => {
    console.log('=== VALIDACIÓN DE ARCHIVO ===');
    console.log('Archivo a validar:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // 1. Validación básica del objeto File
    if (!file || !(file instanceof File)) {
      console.log('❌ Objeto File inválido');
      return 'Archivo inválido';
    }
    
    // 2. Validación del nombre del archivo
    if (!file.name || file.name.trim() === '') {
      console.log('❌ Nombre de archivo vacío');
      return 'El archivo debe tener un nombre válido';
    }
    
    // Verificar caracteres especiales o nombres problemáticos
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(file.name)) {
      console.log('❌ Nombre de archivo contiene caracteres inválidos');
      return 'El nombre del archivo contiene caracteres no permitidos';
    }
    
    // 3. Validación de extensión del archivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!fileExtension) {
      console.log('❌ Archivo sin extensión');
      return 'El archivo debe tener una extensión válida (JPG, PNG, WebP)';
    }
    
    if (!allowedExtensions.includes(fileExtension)) {
      console.log('❌ Extensión no permitida:', fileExtension);
      return `Extensión no permitida: ${fileExtension}. Solo se permiten: ${allowedExtensions.join(', ')}`;
    }
    
    // 4. Validación de tamaño del archivo
    if (file.size === 0) {
      console.log('❌ Archivo vacío');
      return 'El archivo está vacío';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeInMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2);
      console.log('❌ Archivo demasiado grande:', sizeInMB, 'MB');
      return `El archivo es demasiado grande (${sizeInMB}MB). Tamaño máximo: ${maxSizeInMB}MB`;
    }
    
    // 5. Validación de tipo MIME mejorada
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const problematicMimeTypes = ['application/json', 'text/plain', 'application/octet-stream'];
    
    if (file.type === '') {
      console.log('⚠️ Tipo MIME vacío, se corregirá automáticamente');
    } else if (validMimeTypes.includes(file.type)) {
      console.log('✅ Tipo MIME válido:', file.type);
    } else if (problematicMimeTypes.includes(file.type)) {
      console.log('⚠️ Tipo MIME problemático detectado:', file.type, 'pero extensión válida:', fileExtension);
      // Continuar si la extensión es válida, se corregirá en uploadImageToStorage
    } else if (file.type.startsWith('image/')) {
      console.log('⚠️ Tipo MIME de imagen no específico:', file.type, 'pero extensión válida:', fileExtension);
    } else {
      console.log('❌ Tipo MIME no reconocido:', file.type);
      return `Tipo de archivo no soportado: ${file.type}. Solo se permiten imágenes (JPG, PNG, WebP)`;
    }
    
    console.log('✅ Archivo válido - Validaciones básicas pasaron');
    console.log('=== FIN VALIDACIÓN ===');
    return null;
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${product?.id || 'temp'}/${Date.now()}.${fileExt}`;
    
    console.log('=== INICIO SUBIDA DE ARCHIVO ===');
    
    // Debug functions removed during cleanup
    
    console.log('Archivo original:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // Verificar que el usuario esté autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    console.log('Usuario autenticado:', user.id);
    
    // Determinar el tipo MIME correcto basado en la extensión
    let contentType = file.type;
    console.log('Tipo MIME original del archivo:', contentType);
    
    // SIEMPRE corregir el tipo MIME basado en la extensión para evitar problemas
    let correctedContentType = contentType;
    switch (fileExt) {
      case 'jpg':
      case 'jpeg':
        correctedContentType = 'image/jpeg';
        break;
      case 'png':
        correctedContentType = 'image/png';
        break;
      case 'webp':
        correctedContentType = 'image/webp';
        break;
      default:
        correctedContentType = 'image/jpeg'; // fallback
    }
    
    if (contentType !== correctedContentType) {
      console.log('🔧 Corrigiendo tipo MIME de', contentType, 'a', correctedContentType);
    }
    
    // Crear un nuevo File con el tipo MIME correcto SIEMPRE
    let fileToUpload: File;
    try {
      // Leer el archivo como ArrayBuffer para crear un nuevo Blob
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: correctedContentType });
      
      fileToUpload = new File([blob], file.name, {
        type: correctedContentType,
        lastModified: file.lastModified
      });
      
      console.log('✅ Archivo recreado con tipo MIME correcto:', {
        originalType: file.type,
        newType: fileToUpload.type,
        name: fileToUpload.name,
        size: fileToUpload.size
      });
    } catch (error) {
      console.warn('⚠️ Error al recrear archivo, usando método alternativo:', error);
      
      // Método alternativo: crear Blob directamente
      try {
        const blob = new Blob([file], { type: correctedContentType });
        fileToUpload = new File([blob], file.name, {
          type: correctedContentType,
          lastModified: file.lastModified
        });
        console.log('✅ Archivo recreado con método alternativo');
      } catch (altError) {
        console.warn('⚠️ Método alternativo falló, usando archivo original:', altError);
        fileToUpload = file;
      }
    }
    
    console.log('📤 Archivo final para subida:', {
      name: fileToUpload.name,
      type: fileToUpload.type,
      size: fileToUpload.size
    });
    
    try {
      console.log('🚀 Iniciando subida a Supabase Storage...');
      
      // Intentar subida con contentType explícito
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: correctedContentType // Forzar el tipo MIME correcto
        });

      if (error) {
        console.error('❌ Error de subida:', error);
        console.error('Detalles del error:', {
          message: error.message,
          name: error.name
        });
        
        // Si el error es por tipo MIME, intentar sin contentType
        if (error.message.includes('mime type') || error.message.includes('content type')) {
          console.log('🔄 Reintentando sin contentType...');
          const { data: retryData, error: retryError } = await supabase.storage
            .from('product-images')
            .upload(fileName, fileToUpload, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            throw new Error(`Error al subir imagen (reintento): ${retryError.message}`);
          }
          
          console.log('✅ Subida exitosa en reintento');
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          
          console.log('🔗 URL pública generada:', publicUrl);
          
          // Debug functions removed during cleanup
          
          // DEBUG: Verificar configuración de Supabase (reintento)
          console.log('🏢 Verificando configuración de Supabase (reintento)...');
          const { data: { user } } = await supabase.auth.getUser();
          console.log('👤 Usuario (reintento):', user ? { id: user.id, email: user.email } : 'No autenticado');
          
          // Verificar bucket (reintento)
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
          if (bucketError) {
            console.error('❌ Error al listar buckets (reintento):', bucketError);
          } else {
            const productImagesBucket = buckets?.find(b => b.id === 'product-images');
            console.log('📦 Bucket product-images (reintento):', productImagesBucket ? {
              id: productImagesBucket.id,
              name: productImagesBucket.name,
              public: productImagesBucket.public
            } : 'No encontrado');
          }
          
          console.log('=== FIN SUBIDA DE ARCHIVO ===');
          return publicUrl;
        }
        
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      console.log('✅ Archivo subido exitosamente:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('🔗 URL pública generada:', publicUrl);
      
      // Debug functions removed during cleanup
      
      // DEBUG: Verificar configuración de Supabase
      console.log('🏢 Verificando configuración de Supabase...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuario:', user ? { id: user.id, email: user.email } : 'No autenticado');
      
      // Verificar bucket
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('❌ Error al listar buckets:', bucketError);
      } else {
        const productImagesBucket = buckets?.find(b => b.id === 'product-images');
        console.log('📦 Bucket product-images:', productImagesBucket ? {
          id: productImagesBucket.id,
          name: productImagesBucket.name,
          public: productImagesBucket.public
        } : 'No encontrado');
      }
      
      console.log('=== FIN SUBIDA DE ARCHIVO ===');
      
      return publicUrl;
    } catch (error) {
      console.error('❌ Error completo en subida:', error);
      throw error;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (productImages.length + files.length > MAX_IMAGES) {
      toast({
        title: "Demasiadas imágenes",
        description: `Puedes subir máximo ${MAX_IMAGES} imágenes`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newImages: ProductImage[] = [];

    for (const file of files) {
      try {
        const validationError = validateFile(file);
        if (validationError) {
          toast({
            title: "Error de validación",
            description: validationError,
            variant: "destructive",
          });
          continue;
        }

        const imageUrl = await uploadImageToStorage(file);
        const newImage: ProductImage = {
          image_url: imageUrl,
          display_order: productImages.length + newImages.length,
          is_primary: productImages.length + newImages.length === 0, // First image is primary
          file
        };
        newImages.push(newImage);
        
        toast({
          title: "Imagen subida exitosamente",
          description: `${file.name} se subió correctamente`,
          variant: "default",
        });
      } catch (error) {
        console.error('Error al procesar imagen:', file.name, error);
        toast({
          title: "Error al procesar imagen",
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: "destructive",
        });
      }
    }

    const updatedImages = [...productImages, ...newImages];
    setProductImages(updatedImages);
    setUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = productImages[index];
    const updatedImages = productImages.filter((_, i) => i !== index);
    
    // Update primary image if needed
    if (imageToRemove.is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true;
    }
    
    // Update display order
    updatedImages.forEach((img, i) => {
      img.display_order = i;
    });
    
    setProductImages(updatedImages);

    // Delete from storage if it was uploaded
    if (imageToRemove.file && product?.id) {
      try {
        const fileName = imageToRemove.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('product-images')
            .remove([`${product.id}/${fileName}`]);
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
  };

  const setPrimaryImage = (index: number) => {
    const updatedImages = productImages.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    setProductImages(updatedImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set the primary image URL as the main image_url for backward compatibility
    const primaryImage = productImages.find(img => img.is_primary);
    const submitData = {
      ...formData,
      image_url: primaryImage?.image_url || formData.image_url,
    };
    
    // Submit the product first
    const result = await onSubmit(submitData);
    
    // If we have images and a product ID, save the images
    if (productImages.length > 0 && (product?.id || result?.id)) {
      try {
        const productId = product?.id || result?.id;
        
        // For now, just save the primary image URL to the product
        // The multiple images functionality can be implemented later
        // when the database types are properly configured
        
        toast({
          title: "Éxito",
          description: "Producto guardado correctamente. Las imágenes múltiples se implementarán en la próxima versión.",
        });
      } catch (error) {
        console.error('Error handling product images:', error);
        toast({
          title: "Error",
          description: "Producto guardado pero hubo un problema con las imágenes",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Éxito",
        description: "Producto guardado correctamente",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="productName" className="text-sm font-medium">Nombre *</label>
          <Input
            id="productName"
            name="productName"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label htmlFor="productCategory" className="text-sm font-medium">Categoría *</label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => setFormData({...formData, category_id: value})}
          >
            <SelectTrigger id="productCategory">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="productDescription" className="text-sm font-medium">Descripción</label>
        <Textarea
          id="productDescription"
          name="productDescription"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="productBasePrice" className="text-sm font-medium">Precio Base *</label>
          <Input
            id="productBasePrice"
            name="productBasePrice"
            type="number"
            value={formData.base_price}
            onChange={(e) => setFormData({...formData, base_price: Number(e.target.value)})}
            required
          />
        </div>
        
        <div>
          <label htmlFor="productExtraHourPercentage" className="text-sm font-medium">% Hora Extra</label>
          <Input
            id="productExtraHourPercentage"
            name="productExtraHourPercentage"
            type="number"
            value={formData.extra_hour_percentage}
            onChange={(e) => setFormData({...formData, extra_hour_percentage: Number(e.target.value)})}
          />
        </div>
      </div>

      <div>
        <label htmlFor="productDisplayOrder" className="text-sm font-medium">Orden de Visualización</label>
        <Input
          id="productDisplayOrder"
          name="productDisplayOrder"
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})}
        />
      </div>

      {/* Image Upload Section */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Imágenes del Producto</label>
          
          {/* Upload Guidelines */}
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Recomendaciones:</strong> Imágenes en formato JPG, PNG o WebP. 
              Tamaño máximo 5MB. Dimensiones recomendadas: 800x600px. 
              Puedes subir hasta {MAX_IMAGES} imágenes.
            </AlertDescription>
          </Alert>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || productImages.length >= MAX_IMAGES}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Subiendo...' : `Subir Imagen${productImages.length >= MAX_IMAGES ? ' (Máximo alcanzado)' : ''}`}
          </Button>
          
          <Badge variant="secondary">
            {productImages.length}/{MAX_IMAGES} imágenes
          </Badge>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Image Preview */}
        {productImages.length > 0 && (
          <div className="space-y-4">
            {productImages.length === 1 ? (
              <Card className="relative">
                <CardContent className="p-4">
                  <div className="relative">
                    <img
                      src={productImages[0].image_url}
                      alt="Producto"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge variant="default" className="text-xs">
                        Principal
                      </Badge>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(0)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Carousel className="w-full max-w-2xl">
                <CarouselContent>
                  {productImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <Card className="relative">
                        <CardContent className="p-4">
                          <div className="relative">
                            <img
                              src={image.image_url}
                              alt={`Producto ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Badge 
                                variant={image.is_primary ? "default" : "secondary"} 
                                className="text-xs cursor-pointer"
                                onClick={() => setPrimaryImage(index)}
                              >
                                {image.is_primary ? "Principal" : "Hacer principal"}
                              </Badge>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeImage(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="outline" className="text-xs">
                                {index + 1} de {productImages.length}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>
        )}

        {/* Empty State */}
        {productImages.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No hay imágenes subidas. Haz clic en "Subir Imagen" para agregar la primera imagen del producto.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          {product ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </form>
  );
}

// Category Form Component
function CategoryForm({ 
  category, 
  onSubmit 
}: { 
  category?: Category; 
  onSubmit: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    display_order: category?.display_order || 0,
    image_url: category?.image_url || '',
    is_active: category?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="categoryName" className="text-sm font-medium">Nombre *</label>
        <Input
          id="categoryName"
          name="categoryName"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label htmlFor="categoryDescription" className="text-sm font-medium">Descripción</label>
        <Textarea
          id="categoryDescription"
          name="categoryDescription"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryImageUrl" className="text-sm font-medium">URL de Imagen</label>
          <Input
            id="categoryImageUrl"
            name="categoryImageUrl"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            placeholder="https://..."
          />
        </div>
        
        <div>
          <label htmlFor="categoryDisplayOrder" className="text-sm font-medium">Orden de Visualización</label>
          <Input
            id="categoryDisplayOrder"
            name="categoryDisplayOrder"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          {category ? 'Actualizar' : 'Crear'} Categoría
        </Button>
      </div>
    </form>
  );
}