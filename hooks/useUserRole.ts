import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'customer' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Intentar obtener el rol del usuario
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.warn('Error al obtener rol del usuario:', error);
          // Si no existe el rol, intentar asignar el rol de customer
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'customer',
            });

          if (insertError) {
            console.error('Error al asignar rol de customer:', insertError);
            setRole(null);
          } else {
            setRole('customer');
          }
        } else {
          setRole(data.role as UserRole);
        }
      } catch (error) {
        console.error('Error en useUserRole:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isCustomer = role === 'customer';

  return {
    role,
    loading,
    isAdmin,
    isCustomer,
  };
}; 