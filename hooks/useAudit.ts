import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Tipos para el sistema de auditoría
export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  old_values: any;
  new_values: any;
  changed_fields: string[];
  admin_user_id: string;
  admin_user_email: string;
  timestamp: string;
  description: string;
}

export interface ReservationHistory {
  id: string;
  action: string;
  old_status: string;
  new_status: string;
  admin_user_email: string;
  change_timestamp: string;
  description: string;
}

// Hook para obtener historial de una reserva
export const useReservationHistory = (reservationId: string) => {
  return useQuery({
    queryKey: ['reservation-history', reservationId],
    queryFn: async (): Promise<ReservationHistory[]> => {
      console.log('🔍 Obteniendo historial para reserva:', reservationId);
      
      try {
        const { data, error } = await supabase
          .rpc('get_reservation_history', {
            reservation_id: reservationId
          });

        console.log('📊 Respuesta de get_reservation_history:', { data, error });

        if (error) {
          console.error('❌ Error en get_reservation_history:', error);
          throw new Error(`Error al obtener historial: ${error.message}`);
        }

        const result = data || [];
        console.log('✅ Historial obtenido:', result);
        return result;
      } catch (error) {
        console.error('❌ Error general en useReservationHistory:', error);
        throw error;
      }
    },
    enabled: !!reservationId,
    retry: 1, // Solo reintentar una vez
    retryDelay: 1000, // Esperar 1 segundo antes de reintentar
  });
};

// Hook para revertir estado de reserva
export const useRevertReservationStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      reservationId,
      targetStatus,
      adminUserId
    }: {
      reservationId: string;
      targetStatus: string;
      adminUserId: string;
    }) => {
      const { data, error } = await supabase
        .rpc('revert_reservation_status', {
          reservation_id: reservationId,
          target_status: targetStatus,
          admin_user_id: adminUserId
        });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      queryClient.invalidateQueries({ 
        queryKey: ['reservation-history', variables.reservationId] 
      });

      toast({
        title: "Estado revertido",
        description: `La reserva ha sido revertida al estado anterior correctamente.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al revertir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para obtener logs de auditoría generales
export const useAuditLogs = (filters?: {
  tableName?: string;
  recordId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.tableName) {
        query = query.eq('table_name', filters.tableName);
      }

      if (filters?.recordId) {
        query = query.eq('record_id', filters.recordId);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

// Hook para establecer contexto de admin (versión optimizada)
export const useSetAdminContext = () => {
  return useMutation({
    mutationFn: async ({
      userId,
      userEmail
    }: {
      userId: string;
      userEmail: string;
    }) => {
      console.log('🔧 Estableciendo contexto de admin para:', userEmail);
      
      try {
        // Usar la función simple para evitar problemas de recursos
        const { error } = await supabase
          .rpc('set_admin_context_simple', {
            user_id: userId,
            user_email: userEmail
          });

        if (error) {
          console.error('❌ Error al establecer contexto de admin:', error);
          
          // Si hay error de recursos, intentar con la función completa
          if (error.message.includes('ERR_INSUFFICIENT_RESOURCE')) {
            console.log('🔄 Reintentando con función completa...');
            const { error: error2 } = await supabase
              .rpc('set_admin_context', {
                user_id: userId,
                user_email: userEmail
              });
            
            if (error2) {
              throw new Error(`Error al establecer contexto: ${error2.message}`);
            }
          } else {
            throw new Error(`Error al establecer contexto: ${error.message}`);
          }
        }
        
        console.log('✅ Contexto de admin establecido correctamente');
      } catch (error) {
        console.error('❌ Error general en set_admin_context:', error);
        // No lanzar el error para evitar que rompa la aplicación
        console.warn('⚠️ Continuando sin contexto de admin');
      }
    },
    retry: false, // No reintentar automáticamente
  });
}; 