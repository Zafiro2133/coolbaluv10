import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Costo fijo de entrega y retiro
export const DELIVERY_COST = 5000; // $5,000 pesos

export interface Zone {
  id: string;
  name: string;
  description?: string;
  postal_codes: string[];
  neighborhoods: string[];
  transport_cost: number;
  is_active: boolean;
}

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

// Zone hooks
export const useZones = () => {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .eq('is_active', true)
        .order('transport_cost', { ascending: true });

      if (error) throw new Error(error.message);
      return data as Zone[];
    },
  });
};

export const useValidateAddress = () => {
  return useMutation({
    mutationFn: async (address: string) => {
      const addressLower = address.toLowerCase();
      
      // Zonas de Rosario y alrededores con sus códigos postales y barrios
      const rosarioZones = [
        {
          id: 'rosario-centro',
          name: 'Rosario Centro',
          description: 'Centro de Rosario y barrios céntricos',
          postal_codes: ['2000', '2001', '2002', '2003', '2004'],
          neighborhoods: [
            'centro', 'microcentro', 'pichincha', 'pichincha norte', 'pichincha sur',
            'republica de la sexta', 'republica de la sexta norte', 'republica de la sexta sur',
            'san martin', 'san martin norte', 'san martin sur', 'san nicolas',
            'catamarca', 'catamarca norte', 'catamarca sur', 'san juan', 'san juan norte',
            'san juan sur', 'santa fe', 'santa fe norte', 'santa fe sur'
          ],
          transport_cost: 5000,
          is_active: true
        },
        {
          id: 'rosario-norte',
          name: 'Rosario Norte',
          description: 'Zona norte de Rosario',
          postal_codes: ['2005', '2006', '2007', '2008'],
          neighborhoods: [
            'nuevo alberdi', 'alberdi', 'alberdi norte', 'alberdi sur',
            'la flordida', 'flordida', 'la flordida norte', 'la flordida sur',
            'triangulo', 'triangulo norte', 'triangulo sur', 'triangulo este',
            'triangulo oeste', 'triangulo central', 'triangulo norte este',
            'triangulo norte oeste', 'triangulo sur este', 'triangulo sur oeste',
            'la guardia', 'guardia', 'la guardia norte', 'la guardia sur',
            'la guardia este', 'la guardia oeste', 'la guardia central'
          ],
          transport_cost: 6000,
          is_active: true
        },
        {
          id: 'rosario-sur',
          name: 'Rosario Sur',
          description: 'Zona sur de Rosario',
          postal_codes: ['2009', '2010', '2011', '2012'],
          neighborhoods: [
            'parque españa', 'parque espana', 'parque españa norte', 'parque españa sur',
            'parque españa este', 'parque españa oeste', 'parque españa central',
            'parque independencia', 'parque independencia norte', 'parque independencia sur',
            'parque independencia este', 'parque independencia oeste', 'parque independencia central',
            'parque urquiza', 'parque urquiza norte', 'parque urquiza sur',
            'parque urquiza este', 'parque urquiza oeste', 'parque urquiza central',
            'parque de la costa', 'parque de la costa norte', 'parque de la costa sur',
            'parque de la costa este', 'parque de la costa oeste', 'parque de la costa central'
          ],
          transport_cost: 6000,
          is_active: true
        },
        {
          id: 'rosario-oeste',
          name: 'Rosario Oeste',
          description: 'Zona oeste de Rosario',
          postal_codes: ['2013', '2014', '2015', '2016'],
          neighborhoods: [
            'fisherton', 'fisherton norte', 'fisherton sur', 'fisherton este',
            'fisherton oeste', 'fisherton central', 'fisherton norte este',
            'fisherton norte oeste', 'fisherton sur este', 'fisherton sur oeste',
            'arroyito', 'arroyito norte', 'arroyito sur', 'arroyito este',
            'arroyito oeste', 'arroyito central', 'arroyito norte este',
            'arroyito norte oeste', 'arroyito sur este', 'arroyito sur oeste',
            'ludueña', 'ludueña norte', 'ludueña sur', 'ludueña este',
            'ludueña oeste', 'ludueña central', 'ludueña norte este',
            'ludueña norte oeste', 'ludueña sur este', 'ludueña sur oeste'
          ],
          transport_cost: 7000,
          is_active: true
        },
        {
          id: 'rosario-este',
          name: 'Rosario Este',
          description: 'Zona este de Rosario',
          postal_codes: ['2017', '2018', '2019', '2020'],
          neighborhoods: [
            'puerto norte', 'puerto norte norte', 'puerto norte sur', 'puerto norte este',
            'puerto norte oeste', 'puerto norte central', 'puerto norte norte este',
            'puerto norte norte oeste', 'puerto norte sur este', 'puerto norte sur oeste',
            'puerto sur', 'puerto sur norte', 'puerto sur sur', 'puerto sur este',
            'puerto sur oeste', 'puerto sur central', 'puerto sur norte este',
            'puerto sur norte oeste', 'puerto sur sur este', 'puerto sur sur oeste',
            'puerto central', 'puerto central norte', 'puerto central sur', 'puerto central este',
            'puerto central oeste', 'puerto central central', 'puerto central norte este',
            'puerto central norte oeste', 'puerto central sur este', 'puerto central sur oeste'
          ],
          transport_cost: 7000,
          is_active: true
        },
        {
          id: 'alrededores-cercanos',
          name: 'Alrededores Cercanos',
          description: 'Localidades cercanas a Rosario',
          postal_codes: ['2101', '2102', '2103', '2104', '2105', '2106', '2107', '2108', '2109', '2110'],
          neighborhoods: [
            'funes', 'funes norte', 'funes sur', 'funes este', 'funes oeste', 'funes central',
            'roldan', 'roldan norte', 'roldan sur', 'roldan este', 'roldan oeste', 'roldan central',
            'san lorenzo', 'san lorenzo norte', 'san lorenzo sur', 'san lorenzo este', 'san lorenzo oeste', 'san lorenzo central',
            'capitán bermúdez', 'capitan bermudez', 'capitán bermúdez norte', 'capitán bermúdez sur', 'capitán bermúdez este', 'capitán bermúdez oeste', 'capitán bermúdez central',
            'granadero baigorria', 'granadero baigorria norte', 'granadero baigorria sur', 'granadero baigorria este', 'granadero baigorria oeste', 'granadero baigorria central',
            'pérez', 'perez', 'pérez norte', 'pérez sur', 'pérez este', 'pérez oeste', 'pérez central',
            'zavalla', 'zavalla norte', 'zavalla sur', 'zavalla este', 'zavalla oeste', 'zavalla central',
            'alvear', 'alvear norte', 'alvear sur', 'alvear este', 'alvear oeste', 'alvear central',
            'coronel domínguez', 'coronel dominguez', 'coronel domínguez norte', 'coronel domínguez sur', 'coronel domínguez este', 'coronel domínguez oeste', 'coronel domínguez central',
            'acebal', 'acebal norte', 'acebal sur', 'acebal este', 'acebal oeste', 'acebal central',
            'casilda', 'casilda norte', 'casilda sur', 'casilda este', 'casilda oeste', 'casilda central'
          ],
          transport_cost: 8000,
          is_active: true
        }
      ];

      // Verificar si la dirección está en alguna zona
      for (const zone of rosarioZones) {
        // Verificar códigos postales
        for (const postalCode of zone.postal_codes) {
          if (addressLower.includes(postalCode)) {
            return zone;
          }
        }
        
        // Verificar barrios
        for (const neighborhood of zone.neighborhoods) {
          if (addressLower.includes(neighborhood)) {
            return zone;
          }
        }
      }

      // Verificar palabras clave generales de Rosario
      const rosarioKeywords = ['rosario', 'santa fe', 'argentina'];
      const hasRosarioKeywords = rosarioKeywords.some(keyword => addressLower.includes(keyword));
      
      if (hasRosarioKeywords) {
        // Si menciona Rosario pero no coincide con zonas específicas, asignar zona centro
        return rosarioZones[0];
      }

      // Verificar si es una dirección de Rosario por el formato (calles típicas)
      const rosarioStreets = [
        'san martin', 'san martín', 'santa fe', 'cordoba', 'córdoba', 'corrientes',
        'mitre', 'belgrano', 'urquiza', 'moreno', 'sarmiento', 'rivadavia',
        'independencia', 'españa', 'espana', 'pellegrini', 'oroño', 'boulevard',
        'catamarca', 'san juan', 'mendoza', 'la rioja', 'santiago del estero',
        'tucuman', 'tucumán', 'salta', 'jujuy', 'formosa', 'chaco', 'misiones',
        'entre rios', 'entre ríos', 'corrientes', 'buenos aires', 'montevideo',
        'paraguay', 'brasil', 'chile', 'bolivia', 'peru', 'perú', 'uruguay'
      ];

      const hasRosarioStreet = rosarioStreets.some(street => addressLower.includes(street));
      if (hasRosarioStreet) {
        // Si tiene una calle típica de Rosario, asignar zona centro
        return rosarioZones[0];
      }

      return null; // Dirección no está en área de cobertura
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
  const subtotal = cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  return subtotal + DELIVERY_COST;
};

export const calculateCartSubtotal = (cartItems: CartItem[]) => {
  return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
};