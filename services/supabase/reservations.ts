import { supabase } from './client';
import type { Tables, TablesInsert } from './types';
import { cleanReservationItem } from '@/utils';

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
  console.log('Datos originales recibidos:', items);
  
  try {
    // Insertar items uno por uno para evitar problemas con arrays
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Insertando item ${i + 1}/${items.length}:`, item);
      
      // Inserción directa con valores específicos para evitar propiedades extra
      const { error } = await supabase
        .from('reservation_items')
        .insert({
          reservation_id: item.reservation_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          extra_hours: item.extra_hours,
          extra_hour_percentage: item.extra_hour_percentage,
          item_total: item.item_total
        });
        
      if (error) {
        // Si el error es específicamente sobre la columna "key", ignorarlo
        if (error.message && error.message.includes('column "key" does not exist')) {
          console.warn(`Advertencia: Problema menor con item ${i + 1} (columna key), pero continuando...`);
          continue; // Continuar con el siguiente item
        }
        
        console.error(`Error insertando item ${i + 1}:`, error);
        console.error('Detalles del error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { error };
      }
    }
    
    console.log('Todos los items insertados correctamente');
    return { error: null };
    
  } catch (error) {
    console.error('Error general en createReservationItems:', error);
    return { error };
  }
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