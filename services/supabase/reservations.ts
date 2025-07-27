import { supabase } from './client';
import type { Tables, TablesInsert } from './types';

// Crear una reserva
export async function createReservation(
  reservation: TablesInsert<'reservations'>
): Promise<{ data: Tables<'reservations'> | null; error: any }> {
  const { data, error } = await supabase
    .from('reservations')
    .insert(reservation)
    .select()
    .single();
  return { data, error };
}

// Crear ítems de reserva
export async function createReservationItems(
  items: TablesInsert<'reservation_items'>[]
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('reservation_items')
    .insert(items);
  return { error };
}

// Obtener reservas de un usuario
export async function getUserReservations(userId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, reservation_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Obtener reservas para admin (con filtros opcionales)
export async function getReservationsAdmin(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    // Consulta simple sin JOIN complejo
    let query = supabase
      .from('reservations')
      .select(`*, reservation_items(*)`)
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
    
    if (error) {
      console.error('Error en getReservationsAdmin:', error);
      throw error;
    }
    
    // Si necesitamos datos de profiles, los obtenemos por separado
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone')
        .in('user_id', userIds);
      
      // Combinar los datos
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const enrichedData = data.map(reservation => ({
        ...reservation,
        user_profile: profilesMap.get(reservation.user_id) || null
      }));
      
      return { data: enrichedData, error: null };
    }
    
    return { data, error };
  } catch (error) {
    console.error('Error en getReservationsAdmin:', error);
    throw error;
  }
}

// Actualizar estado de una reserva
export async function updateReservationStatus(reservationId: string, status: string) {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', reservationId);
  return { error };
} 