import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export type UserRole = 'admin' | 'customer';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface ReservationWithDetails {
  id: string;
  user_id: string;
  event_date: string;
  event_time: string;
  event_address: string;
  zone_id?: string;
  adult_count: number;
  child_count: number;
  comments?: string;
  subtotal: number;
  transport_cost: number;
  total: number;
  status: 'pending_payment' | 'paid' | 'confirmed' | 'cancelled';
  payment_proof_url?: string;
  created_at: string;
  updated_at: string;
  zone?: {
    name: string;
    transport_cost: number;
  };
  user_profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  reservation_items?: Array<{
    id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    extra_hours: number;
    extra_hour_percentage: number;
    item_total: number;
  }>;
}

export interface DashboardStats {
  totalReservations: number;
  pendingPayments: number;
  confirmedReservations: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  popularProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

// Role management hooks
export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        throw new Error(error.message);
      }
      if (!data) {
        console.log('No user role found for user:', user.id);
      } else {
        console.log('User role for', user.id, ':', data.role);
      }
      return data as UserRoleData | null;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });
};

export const useIsAdmin = () => {
  const { data: userRole, isLoading, refetch } = useUserRole();
  // Forzar refetch si el usuario cambia
  useEffect(() => { refetch(); }, [userRole?.user_id]);
  return userRole?.role === 'admin';
};

// Admin reservation management
export const useReservations = (filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['admin-reservations', filters],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          user_profile:profiles!reservations_user_id_fkey(first_name, last_name, phone),
          reservation_items(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('event_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('event_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      const normalized = (data || []).map((r) => ({
        ...r,
        reservation_items: Array.isArray(r.reservation_items) ? r.reservation_items : [],
        // zone eliminado temporalmente
      }));

      return normalized as ReservationWithDetails[];
    },
  });
};

export const useUpdateReservationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      reservationId, 
      status, 
      paymentProofUrl 
    }: {
      reservationId: string;
      status: string;
      paymentProofUrl?: string;
    }) => {
      const updates: any = { status };
      if (paymentProofUrl) {
        updates.payment_proof_url = paymentProofUrl;
      }

      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

// Dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get basic reservation counts
      const { data: reservationCounts } = await supabase
        .from('reservations')
        .select('status, total, created_at');

      // Get popular products this month
      const { data: popularProducts } = await supabase
        .from('reservation_items')
        .select(`
          product_name,
          quantity,
          item_total,
          reservation:reservations!inner(created_at, status)
        `)
        .gte('reservation.created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .eq('reservation.status', 'confirmed');

      if (!reservationCounts) {
        throw new Error('Failed to fetch reservation stats');
      }

      const totalReservations = reservationCounts.length;
      const pendingPayments = reservationCounts.filter(r => r.status === 'pending_payment').length;
      const confirmedReservations = reservationCounts.filter(r => r.status === 'confirmed').length;
      const totalRevenue = reservationCounts
        .filter(r => r.status === 'confirmed')
        .reduce((sum, r) => sum + Number(r.total), 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthRevenue = reservationCounts
        .filter(r => 
          r.status === 'confirmed' && 
          new Date(r.created_at) >= thisMonth
        )
        .reduce((sum, r) => sum + Number(r.total), 0);

      // Calculate popular products
      const productStats = popularProducts?.reduce((acc: any, item: any) => {
        const existing = acc[item.product_name] || { 
          product_name: item.product_name, 
          total_quantity: 0, 
          total_revenue: 0 
        };
        existing.total_quantity += item.quantity;
        existing.total_revenue += Number(item.item_total);
        acc[item.product_name] = existing;
        return acc;
      }, {});

      const popularProductsArray = Object.values(productStats || {})
        .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      return {
        totalReservations,
        pendingPayments,
        confirmedReservations,
        totalRevenue,
        thisMonthRevenue,
        popularProducts: popularProductsArray,
      } as DashboardStats;
    },
  });
};

// Product management
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: any) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, ...updates }: { productId: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
};

export const useDuplicateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      // Primero obtener el producto original
      const { data: originalProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (!originalProduct) throw new Error('Producto no encontrado');

      // Crear una copia del producto con "Copia" en el nombre
      const duplicatedProduct = {
        ...originalProduct,
        id: undefined, // Para que se genere un nuevo ID
        name: `${originalProduct.name} (Copia)`,
        is_active: false, // Por defecto inactivo para revisión
        created_at: undefined, // Para que se genere automáticamente
        updated_at: undefined, // Para que se genere automáticamente
      };

      const { data, error } = await supabase
        .from('products')
        .insert(duplicatedProduct)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
};

// Category management
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: any) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, ...updates }: { categoryId: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
};

// Zone management
export const useUpdateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      zoneId, 
      ...updates 
    }: {
      zoneId: string;
      [key: string]: any;
    }) => {
      const { data, error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', zoneId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
  });
};