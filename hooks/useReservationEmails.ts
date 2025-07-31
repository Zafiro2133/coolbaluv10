import { useState } from 'react';
import { supabase } from '@/services/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/services/supabase/types';

interface SendEmailsResult {
  success: boolean;
  error?: string;
  message?: string;
  sentTo?: {
    cliente: string;
    admin: string;
  };
}

/**
 * Hook personalizado para manejar el envío de correos de confirmación de reservas
 */
export function useReservationEmails() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Envía correos de confirmación usando la Edge Function de Supabase
   */
  const sendReservationEmails = async (
    reservationId: string,
    clienteEmail: string
  ): Promise<SendEmailsResult> => {
    setIsLoading(true);

    try {
      // Validar datos de entrada
      if (!reservationId) {
        throw new Error('ID de reserva requerido');
      }

      if (!clienteEmail || !clienteEmail.includes('@')) {
        throw new Error('Email del cliente no válido');
      }

      console.log('📧 Enviando correos para reserva:', reservationId, 'a:', clienteEmail);

      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('send-reservation-emails', {
        body: {
          reservationId,
          clienteEmail
        }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw new Error(error.message || 'Error enviando correos');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido');
      }

      console.log('✅ Respuesta de Edge Function:', data);

      // Mostrar mensaje de éxito
      toast({
        title: "✅ Correos enviados",
        description: "Los correos de confirmación han sido enviados exitosamente.",
        variant: "default",
      });

      return {
        success: true,
        message: data.message || 'Correos enviados exitosamente',
        sentTo: data.sentTo
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      console.error('❌ Error enviando correos:', error);
      
      // Mostrar mensaje de error
      toast({
        title: "❌ Error enviando correos",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };

    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Envía correos de confirmación usando la función local (para desarrollo)
   */
  const sendReservationEmailsLocal = async (
    reservation: Tables<'reservations'> & {
      reservation_items?: Tables<'reservation_items'>[];
      user_profile?: {
        first_name?: string | null;
        last_name?: string | null;
        phone?: string | null;
      };
      zone?: {
        name: string;
      } | null;
    },
    clienteEmail: string
  ): Promise<SendEmailsResult> => {
    setIsLoading(true);

    try {
      // Importar dinámicamente la función local
      const { sendReservationEmails } = await import('@/services/supabase/sendReservationEmails');
      
      const result = await sendReservationEmails(reservation, clienteEmail);

      if (result.success) {
        toast({
          title: "✅ Correos enviados",
          description: "Los correos de confirmación han sido enviados exitosamente.",
          variant: "default",
        });
      } else {
        toast({
          title: "❌ Error enviando correos",
          description: result.error || 'Error desconocido',
          variant: "destructive",
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      console.error('❌ Error enviando correos localmente:', error);
      
      toast({
        title: "❌ Error enviando correos",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };

    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Función de utilidad para obtener el email del usuario autenticado
   */
  const getCurrentUserEmail = async (): Promise<string | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error obteniendo usuario:', error);
        return null;
      }
      
      if (!user?.email) {
        console.warn('⚠️ Usuario no tiene email configurado');
        return null;
      }
      
      console.log('✅ Email del usuario obtenido:', user.email);
      return user.email;
    } catch (error) {
      console.error('❌ Error obteniendo email del usuario:', error);
      return null;
    }
  };

  /**
   * Función completa que obtiene el email del usuario y envía los correos
   */
  const sendEmailsForCurrentUser = async (reservationId: string): Promise<SendEmailsResult> => {
    try {
      console.log('🔄 Obteniendo email del usuario para reserva:', reservationId);
      
      const userEmail = await getCurrentUserEmail();
      
      if (!userEmail) {
        throw new Error('No se pudo obtener el email del usuario. Por favor, verifica que tu cuenta tenga un email válido.');
      }

      console.log('📧 Enviando correos para usuario:', userEmail);
      return await sendReservationEmails(reservationId, userEmail);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      console.error('❌ Error en sendEmailsForCurrentUser:', error);
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Función para reenviar correos (útil para el admin)
   */
  const resendEmails = async (reservationId: string, clienteEmail: string): Promise<SendEmailsResult> => {
    try {
      console.log('🔄 Reenviando correos para reserva:', reservationId);
      
      const result = await sendReservationEmails(reservationId, clienteEmail);
      
      if (result.success) {
        toast({
          title: "✅ Correos reenviados",
          description: "Los correos han sido reenviados exitosamente.",
          variant: "default",
        });
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      console.error('❌ Error reenviando correos:', error);
      
      toast({
        title: "❌ Error reenviando correos",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  return {
    sendReservationEmails,
    sendReservationEmailsLocal,
    sendEmailsForCurrentUser,
    getCurrentUserEmail,
    resendEmails,
    isLoading
  };
} 