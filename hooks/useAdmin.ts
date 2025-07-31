import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { authenticatedQuery } from '@/utils';

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

  adult_count: number;
  child_count: number;
  comments?: string;
  rain_reschedule?: string;
  extra_hours: number;
  subtotal: number;
  transport_cost: number;
  total: number;
  status: 'pending_payment' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
  payment_proof_url?: string;
  created_at: string;
  updated_at: string;

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
      
      console.log('Fetching user role for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Supabase error fetching user role:', error);
          
          // Si es un error de "no encontrado", no es crítico
          if (error.code === 'PGRST116') {
            console.debug('No user role found for user:', user.id);
            return null;
          }
          
          // Para otros errores, verificar si es un problema de permisos
          if (error.code === '406' || error.message.includes('406')) {
            console.error('Error 406 - Possible RLS policy issue or missing headers');
            throw new Error('Error de permisos: Verificar políticas RLS y headers de autenticación');
          }
          
          throw new Error(error.message);
        }
        
        if (!data) {
          console.debug('No user role found for user:', user.id);
        } else {
          console.debug('User role for', user.id, ':', data.role);
        }
        
        return data as UserRoleData | null;
      } catch (error) {
        console.error('Error in useUserRole:', error);
        throw error;
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // No reintentar en errores de permisos
      if (error.message.includes('Error de permisos')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useIsAdmin = () => {
  const { data: userRole, isLoading, refetch } = useUserRole();
  // Forzar refetch si el usuario cambia
  useEffect(() => { refetch(); }, [userRole?.user_id]);
  
  // Si está cargando, devolver false para evitar redirecciones prematuras
  if (isLoading) {
    return false;
  }
  
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
      // Consulta simple sin JOIN problemático
      let query = supabase
        .from('reservations')
        .select(`*, reservation_items(id, reservation_id, product_id, product_name, product_price, quantity, extra_hours, extra_hour_percentage, item_total)`)
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

      // Obtener datos de profiles por separado si hay reservas
      let enrichedData = data || [];
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((r: any) => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, phone')
          .in('user_id', userIds);
        
        const profilesMap = new Map(profilesData?.map((p: any) => [p.user_id, p]) || []);
        enrichedData = data.map((r: any) => ({
          ...r,
          user_profile: profilesMap.get(r.user_id) || null,
          reservation_items: Array.isArray(r.reservation_items) ? r.reservation_items : [],
        }));
      }

      return enrichedData as unknown as ReservationWithDetails[];
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
      try {
        console.log('🔄 Actualizando estado de reserva:', {
          reservationId,
          status,
          hasPaymentProof: !!paymentProofUrl
        });

        // Establecer contexto de admin si es necesario
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          try {
            await supabase.rpc('set_admin_context', {
              user_id: user.id,
              user_email: user.email || ''
            });
            console.log('✅ Contexto de admin establecido');
          } catch (error) {
            console.warn('⚠️ Error estableciendo contexto de admin:', error);
            // Continuar sin contexto de admin
          }
        }

        const updates: any = { status };
        if (paymentProofUrl) {
          updates.payment_proof_url = paymentProofUrl;
        }

        console.log('📝 Actualizaciones a aplicar:', updates);

        const { data, error } = await supabase
          .from('reservations')
          .update(updates)
          .eq('id', reservationId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error al actualizar reserva:', error);
          throw new Error(`Error al actualizar reserva: ${error.message}`);
        }

        if (!data) {
          throw new Error('No se pudo actualizar la reserva');
        }

        console.log('✅ Reserva actualizada exitosamente:', {
          id: data.id,
          status: data.status,
          paymentProofUrl: data.payment_proof_url
        });

        return data;
      } catch (error) {
        console.error('❌ Error en useUpdateReservationStatus:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      console.error('❌ Error en mutación de actualización:', error);
    }
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      console.log('Iniciando eliminación de reserva:', reservationId);
      
      try {
        // Obtener el usuario actual para establecer el contexto de admin
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Establecer contexto de admin antes de hacer el cambio
          try {
            await supabase.rpc('set_admin_context', {
              user_id: user.id,
              user_email: user.email || ''
            });
          } catch (error) {
            console.warn('⚠️ Error estableciendo contexto de admin:', error);
            // Continuar sin contexto de admin
          }
        }

        // Primero eliminar los items de la reserva
        console.log('Eliminando reservation_items...');
        const { error: itemsError } = await supabase
          .from('reservation_items')
          .delete()
          .eq('reservation_id', reservationId);

        if (itemsError) {
          console.error('Error eliminando reservation_items:', itemsError);
          throw new Error(`Error eliminando items de la reserva: ${itemsError.message}`);
        }

        console.log('Items eliminados correctamente');

        // Luego eliminar la reserva
        console.log('Eliminando reserva...');
        const { error } = await supabase
          .from('reservations')
          .delete()
          .eq('id', reservationId);

        if (error) {
          console.error('Error eliminando reserva:', error);
          throw new Error(`Error eliminando reserva: ${error.message}`);
        }

        console.log('Reserva eliminada correctamente');

        return { success: true };
      } catch (error) {
        console.error('Error completo en eliminación:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Eliminación exitosa:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      console.error('Error en mutación de eliminación:', error);
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

export const useDeleteAllProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Usar consulta SQL directa para eliminar todos los productos
      const { error } = await supabase
        .from('products')
        .delete()
        .filter('id', 'not.is', null); // Eliminar todos los productos

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


// System Settings Management
export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Obtener todas las configuraciones del sistema
export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('*')
        .order('setting_key');
      
      if (error) throw new Error(error.message);
      return (data as unknown) as SystemSetting[];
    },
    refetchOnWindowFocus: false,
  });
};

// Obtener una configuración específica
export const useSystemSetting = (settingKey: string) => {
  return useQuery({
    queryKey: ['system-setting', settingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('*')
        .eq('setting_key', settingKey)
        .single();
      
      if (error) throw new Error(error.message);
      return (data as unknown) as SystemSetting;
    },
    enabled: !!settingKey,
  });
};

// Actualizar configuración del sistema
export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      settingKey, 
      settingValue 
    }: {
      settingKey: string;
      settingValue: string;
    }) => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .update({ 
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-setting'] });
    },
  });
};

// Crear nueva configuración del sistema
export const useCreateSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingData: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .insert(settingData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
};