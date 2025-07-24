import { useState } from 'react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useCreateProduct, useUpdateProduct, useDeleteProduct, useDuplicateProduct, useCreateCategory, useUpdateCategory } from '@/hooks/useAdmin';
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
import { Package, Plus, Edit, Trash2, Image, DollarSign, Tag, Eye, EyeOff, Copy } from 'lucide-react';
import { supabase } from '@/services/supabase/client';

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order?: number;
  image_url?: string;
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
  const duplicateProductMutation = useDuplicateProduct();
  const { toast } = useToast();

  const handleCreateProduct = async (productData: any) => {
    try {
      await createProductMutation.mutateAsync(productData);
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente.",
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el producto.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    try {
      await updateProductMutation.mutateAsync({
        productId: selectedProduct!.id,
        ...productData,
      });
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente.",
      });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      });
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
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
                        <DialogContent className="max-w-2xl">
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

  useState(() => {
    fetchCategories();
  });

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
  onSubmit: (data: any) => void; 
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

  const [categories, setCategories] = useState<Category[]>([]);

  useState(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) setCategories(data);
    };
    fetchCategories();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Categoría *</label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => setFormData({...formData, category_id: value})}
          >
            <SelectTrigger>
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
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Precio Base *</label>
          <Input
            type="number"
            value={formData.base_price}
            onChange={(e) => setFormData({...formData, base_price: Number(e.target.value)})}
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">% Hora Extra</label>
          <Input
            type="number"
            value={formData.extra_hour_percentage}
            onChange={(e) => setFormData({...formData, extra_hour_percentage: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">URL de Imagen</label>
          <Input
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            placeholder="https://..."
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Orden de Visualización</label>
          <Input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})}
          />
        </div>
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
        <label className="text-sm font-medium">Nombre *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">URL de Imagen</label>
          <Input
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            placeholder="https://..."
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Orden de Visualización</label>
          <Input
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