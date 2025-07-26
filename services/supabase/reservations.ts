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
  let query = supabase
    .from('reservations')
    .select(`*, user_profile:profiles!reservations_user_id_profiles_fkey(user_id, first_name, last_name, phone), reservation_items(*)`)
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
  return { data, error };
}

// Actualizar estado de una reserva
export async function updateReservationStatus(reservationId: string, status: string) {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', reservationId);
  return { error };
} 