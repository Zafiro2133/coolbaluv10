export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface UserEmailData {
  email: string;
  name: string;
  activationToken?: string;
}

export interface ReservationEmailData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  reservationDate: string;
  paymentDetails: {
    accountNumber: string;
    accountHolder: string;
    bankName: string;
  };
}

export interface AdminEmailData {
  adminEmail: string;
  reservationId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  itemsCount: number;
}

export type EmailType = 
  | 'account-activation'
  | 'welcome'
  | 'reservation-created'
  | 'admin-new-reservation'
  | 'reservation-confirmed';

export interface EmailLog {
  id: string;
  user_id?: string;
  email_type: EmailType;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at?: Date;
  error_message?: string;
  metadata?: Record<string, any>;
} 