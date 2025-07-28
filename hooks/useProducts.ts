import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  file?: File;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  extra_hour_percentage: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Category[];
    },
  });
};

export const useProducts = (categoryId?: string) => {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Product[];
    },
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Product;
    },
  });
};

// Hook para administración - muestra todos los productos (activos e inactivos)
export const useAdminProducts = (categoryId?: string) => {
  return useQuery({
    queryKey: ['admin-products', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('display_order', { ascending: true });

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Product[];
    },
  });
};

// Hook para obtener imágenes de un producto
export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      // Use raw SQL query since product_images table might not be in types
      const { data, error } = await supabase
        .rpc('get_product_images', { product_uuid: productId });

      if (error) {
        console.error('Error fetching product images:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!productId,
  });
};

// Hook para guardar imágenes de un producto
export const useSaveProductImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, images }: { productId: string; images: ProductImage[] }) => {
      // Delete existing images
      await supabase
        .rpc('delete_product_images', { product_uuid: productId });

      // Insert new images
      if (images.length > 0) {
        const { error } = await supabase
          .rpc('insert_product_images', { 
            product_uuid: productId, 
            images_data: images.map(img => ({
              image_url: img.image_url,
              display_order: img.display_order,
              is_primary: img.is_primary
            }))
          });

        if (error) throw new Error(error.message);
      }

      return { success: true };
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};