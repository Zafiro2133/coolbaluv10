import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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