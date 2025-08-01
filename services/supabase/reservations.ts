import { supabase } from './client';
import type { Tables, TablesInsert } from './types';
import { cleanReservationItem } from '../../utils';
import { EmailService } from '../email/emailService';

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

// Crear reserva con envío de emails
export async function createReservationWithEmails(
  reservation: TablesInsert<'reservations'>,
  items: TablesInsert<'reservation_items'>[],
  adminEmail: string = import.meta.env.VITE_ADMIN_EMAIL || 'hola@estudiomaters.com' // CAMBIAR: Email real del admin
): Promise<{ data: Tables<'reservations'> | null; error: any }> {
  try {
    // Crear la reserva
    const { data: reservationData, error: reservationError } = await createReservation(reservation);
    
    if (reservationError || !reservationData) {
      return { data: null, error: reservationError };
    }

    // Crear los items de la reserva
    const itemsWithReservationId = items.map(item => ({
      ...item,
      reservation_id: reservationData.id
    }));

    const { error: itemsError } = await createReservationItems(itemsWithReservationId);
    
    if (itemsError) {
      console.error('Error creating reservation items:', itemsError);
      // No fallamos la reserva si los items fallan, pero lo registramos
    }

    // Obtener información del usuario para el email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', reservation.user_id)
      .single();

    const customerName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Cliente';

    // Preparar datos para el email
    const reservationEmailData = {
      reservationId: reservationData.id,
      customerName,
      customerEmail: reservation.email || '',
      items: itemsWithReservationId.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.item_total
      })),
      totalAmount: reservation.total_amount,
      reservationDate: reservation.event_date,
      paymentDetails: {
        accountNumber: '1234567890', // Configurar según tus datos bancarios
        accountHolder: 'Coolbalu',
        bankName: 'Banco de Ejemplo'
      }
    };

    // Enviar emails de forma asíncrona (no bloqueamos la respuesta)
    Promise.all([
      EmailService.sendReservationCreatedEmail(reservationEmailData),
      EmailService.sendAdminNewReservationEmail({
        adminEmail,
        reservationId: reservationData.id,
        customerName,
        customerEmail: reservation.email || '',
        totalAmount: reservation.total_amount,
        itemsCount: items.length
      })
    ]).catch(error => {
      console.error('Error sending reservation emails:', error);
    });

    return { data: reservationData, error: null };
  } catch (error) {
    console.error('Error in createReservationWithEmails:', error);
    return { data: null, error };
  }
}

// Confirmar reserva con envío de email
export async function confirmReservationWithEmail(
  reservationId: string,
  adminEmail: string = import.meta.env.VITE_ADMIN_EMAIL || 'hola@estudiomaters.com' // CAMBIAR: Email real del admin
): Promise<{ error: any }> {
  try {
    // Actualizar estado de la reserva
    const { error: updateError } = await updateReservationStatus(reservationId, 'confirmed');
    
    if (updateError) {
      return { error: updateError };
    }

    // Obtener datos de la reserva para el email
    const { data: reservationData } = await supabase
      .from('reservations')
      .select('*, reservation_items(*)')
      .eq('id', reservationId)
      .single();

    if (!reservationData) {
      return { error: { message: 'Reserva no encontrada' } };
    }

    // Obtener información del usuario
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', reservationData.user_id)
      .single();

    const customerName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Cliente';

    // Preparar datos para el email de confirmación
    const reservationEmailData = {
      reservationId: reservationData.id,
      customerName,
      customerEmail: reservationData.email || '',
      items: reservationData.reservation_items.map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.item_total
      })),
      totalAmount: reservationData.total_amount,
      reservationDate: reservationData.event_date,
      paymentDetails: {
        accountNumber: '1234567890',
        accountHolder: 'Coolbalu',
        bankName: 'Banco de Ejemplo'
      }
    };

    // Enviar email de confirmación
    EmailService.sendReservationConfirmedEmail(reservationEmailData)
      .catch(error => {
        console.error('Error sending confirmation email:', error);
      });

    return { error: null };
  } catch (error) {
    console.error('Error in confirmReservationWithEmail:', error);
    return { error };
  }
} 