import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';


// Nota: El costo de traslado ahora es dinámico según la zona validada



export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  extra_hours: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    base_price: number;
    extra_hour_percentage: number;
    image_url?: string;
    category?: {
      name: string;
    };
  };
}

// Cart hooks
export const useCartItems = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['cart-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            id,
            name,
            base_price,
            extra_hour_percentage,
            image_url,
            category:categories(name)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
      return data as CartItem[];
    },
    enabled: !!user,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1, extraHours = 0 }: {
      productId: string;
      quantity?: number;
      extraHours?: number;
    }) => {
      if (!user) throw new Error('User must be logged in');

      const { data, error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity,
          extra_hours: extraHours,
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity, extraHours }: {
      itemId: string;
      quantity?: number;
      extraHours?: number;
    }) => {
      const updates: any = {};
      if (quantity !== undefined) updates.quantity = quantity;
      if (extraHours !== undefined) updates.extra_hours = extraHours;

      const { data, error } = await supabase
        .from('cart_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User must be logged in');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
    },
  });
};





// Utility functions
export const calculateItemTotal = (cartItem: CartItem) => {
  if (!cartItem.product) return 0;
  
  const { base_price, extra_hour_percentage } = cartItem.product;
  const baseTotal = base_price * cartItem.quantity;
  const extraHoursCost = (baseTotal * extra_hour_percentage / 100) * cartItem.extra_hours;
  
  return baseTotal + extraHoursCost;
};

export const calculateCartTotal = (cartItems: CartItem[]) => {
  return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
};

export const calculateCartSubtotal = (cartItems: CartItem[]) => {
  return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
};
