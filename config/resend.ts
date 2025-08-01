// Configuración de Resend
export const RESEND_API_KEY = 're_joWXR676_MZuHU9v6sMYBdZBMXB129XrF';

// Configuración del remitente
export const EMAIL_CONFIG = {
  from: 'hola@estudiomaters.com',
  fromName: 'Coolbalu',
  subject: 'Tu pedido de reserva fue exitoso, completá el último paso',
  domain: 'estudiomaters.com'
};

// URL de la edge function
export const EDGE_FUNCTION_URL = 'https://rwgxdtfuzpdukaguogyh.supabase.co/functions/v1/resend-email';

// Tipos para el email
export interface ReservationEmailData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
  adultCount: number;
  childCount: number;
  total: number;
  subtotal: number;
  transportCost: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    extraHours: number;
    itemTotal: number;
  }>;
  paymentProofUrl?: string;
  comments?: string;
  rainReschedule?: string;
} 