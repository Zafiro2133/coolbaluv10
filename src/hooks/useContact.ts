import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type ContactMessage = TablesInsert<'contact_messages'>;

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