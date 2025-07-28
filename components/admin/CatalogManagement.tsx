import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, Trash2, DollarSign, Tag, Eye, EyeOff, Copy, Trash } from 'lucide-react';
import { supabase } from '@/services/supabase/client';
import { CloudinaryImageUpload } from '@/components/ui/cloudinary-image-upload';

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order?: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  category_id: string;
  is_active: boolean;
  display_order?: number;
  extra_hour_percentage?: number;
  image_url?: string | null;
  categories?: Category;
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
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogDescription className="sr-only"> </DialogDescription>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Crear Nuevo Producto</DialogTitle>
                  <DialogDescription className="text-base">
                    Completa los datos para crear un nuevo producto en el catálogo. 
                    Todos los campos marcados con * son obligatorios.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <ProductForm onSubmit={handleCreateProduct} />
                </div>
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
                        <div className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Package className="h-6 w-6 text-muted-foreground hidden" />
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
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogDescription className="sr-only"> </DialogDescription>
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Editar Producto</DialogTitle>
                            <DialogDescription className="text-base">
                              Modifica los datos del producto. Todos los campos marcados con * son obligatorios.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            {selectedProduct && (
                              <ProductForm 
                                product={selectedProduct} 
                                onSubmit={handleUpdateProduct} 
                              />
                            )}
                          </div>
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
    is_active: product?.is_active ?? true,
    image_url: product?.image_url || null,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      toast({
        title: "Éxito",
        description: "Producto guardado correctamente",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Información Básica</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="productName" className="text-sm font-medium text-foreground">
              Nombre del Producto *
            </label>
            <Input
              id="productName"
              name="productName"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Castillo Inflable Princesas"
              required
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="productCategory" className="text-sm font-medium text-foreground">
              Categoría *
            </label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({...formData, category_id: value})}
            >
              <SelectTrigger id="productCategory" className="h-10">
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

        <div className="space-y-2">
          <label htmlFor="productDescription" className="text-sm font-medium text-foreground">
            Descripción
          </label>
          <Textarea
            id="productDescription"
            name="productDescription"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Describe las características y beneficios del producto..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Precios y Configuración */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Precios y Configuración</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="productBasePrice" className="text-sm font-medium text-foreground">
              Precio Base *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="productBasePrice"
                name="productBasePrice"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: Number(e.target.value)})}
                placeholder="0"
                required
                className="h-10 pl-8"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="productExtraHourPercentage" className="text-sm font-medium text-foreground">
              % Hora Extra
            </label>
            <div className="relative">
              <Input
                id="productExtraHourPercentage"
                name="productExtraHourPercentage"
                type="number"
                value={formData.extra_hour_percentage}
                onChange={(e) => setFormData({...formData, extra_hour_percentage: Number(e.target.value)})}
                placeholder="15"
                className="h-10 pr-8"
                min="0"
                max="100"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="productDisplayOrder" className="text-sm font-medium text-foreground">
              Orden de Visualización
            </label>
            <Input
              id="productDisplayOrder"
              name="productDisplayOrder"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})}
              placeholder="0"
              className="h-10"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Imagen del Producto */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Imagen del Producto</h3>
        </div>
        
        <CloudinaryImageUpload
          currentImageUrl={formData.image_url}
          onImageUploaded={(imageUrl) => setFormData({...formData, image_url: imageUrl})}
          onImageRemoved={() => setFormData({...formData, image_url: null})}
          disabled={isSubmitting}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center gap-2 h-10 px-6"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {product ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>
              <Package className="h-4 w-4" />
              {product ? 'Actualizar' : 'Crear'} Producto
            </>
          )}
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
    is_active: category?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting category form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Información Básica</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="categoryName" className="text-sm font-medium text-foreground">
              Nombre de la Categoría *
            </label>
            <Input
              id="categoryName"
              name="categoryName"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Inflables, Catering, Mobiliario..."
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryDescription" className="text-sm font-medium text-foreground">
              Descripción
            </label>
            <Textarea
              id="categoryDescription"
              name="categoryDescription"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe brevemente qué tipo de productos incluye esta categoría..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Configuración</h3>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="categoryDisplayOrder" className="text-sm font-medium text-foreground">
            Orden de Visualización
          </label>
          <Input
            id="categoryDisplayOrder"
            name="categoryDisplayOrder"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})}
            placeholder="0"
            className="h-10"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Número menor = aparece primero en la lista
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center gap-2 h-10 px-6"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {category ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>
              <Tag className="h-4 w-4" />
              {category ? 'Actualizar' : 'Crear'} Categoría
            </>
          )}
        </Button>
      </div>
    </form>
  );
}