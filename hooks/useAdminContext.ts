import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useAdmin';
import { useEffect, useState } from 'react';

// Hook alternativo para manejar el contexto de admin sin RPC
export const useAdminContext = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && userRole) {
      const adminStatus = userRole.role === 'admin';
      setIsAdmin(adminStatus);
      setIsLoading(false);
      
      // Log para debug
      console.log('🔧 Contexto de admin:', {
        userId: user.id,
        userEmail: user.email,
        isAdmin: adminStatus,
        role: userRole.role
      });
    } else if (user && !userRole) {
      // Si no hay rol, asumir que no es admin
      setIsAdmin(false);
      setIsLoading(false);
      console.log('⚠️ Usuario sin rol asignado:', user.email);
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [user, userRole]);

  return {
    isAdmin,
    isLoading,
    user,
    userRole
  };
}; 