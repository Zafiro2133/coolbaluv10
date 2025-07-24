import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import { TablesInsert } from '@/services/supabase/types';

type ContactMessage = TablesInsert<{ schema: "public" }, "contact_messages">;

export const useContact = () => {
  const sendMessage = useMutation({
    mutationFn: async (message: Omit<ContactMessage, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([message])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  return {
    sendMessage,
  };
}; 