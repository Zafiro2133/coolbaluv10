import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import { TablesInsert } from '@/services/supabase/types';
import { sendContactFormEmail } from '@/services/email';

type ContactMessage = TablesInsert<{ schema: "public" }, "contact_messages">;

export const useContact = () => {
  const sendMessage = useMutation({
    mutationFn: async (message: Omit<ContactMessage, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
      // 1. Insertar mensaje en Supabase
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([message])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 2. Enviar email de notificación al administrador
      if (data) {
        try {
          const emailResult = await sendContactFormEmail({
            nombre: message.nombre,
            apellido: message.apellido,
            email: message.email,
            telefono: message.telefono,
            mensaje: message.mensaje,
            contactMessageId: data.id
          });

          if (!emailResult.success) {
            console.warn('⚠️ No se pudo enviar el email de notificación:', emailResult.error);
            // No lanzar error aquí para no fallar el envío del mensaje
          } else {
            console.log('✅ Email de notificación enviado exitosamente');
          }
        } catch (emailError) {
          console.error('❌ Error al enviar email de notificación:', emailError);
          // No lanzar error aquí para no fallar el envío del mensaje
        }
      }

      return data;
    },
  });

  return {
    sendMessage,
  };
}; 