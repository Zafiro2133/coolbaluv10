import { EmailService } from '../services/email/emailService';
import { ReservationEmailData, AdminEmailData } from '../services/email/emailTypes';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './use-toast';

export const useEmail = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendAccountActivationEmail = async (email: string, name: string, activationToken: string) => {
    try {
      const success = await EmailService.sendAccountActivationEmail(email, name, activationToken);
      
      if (success) {
        toast({
          title: "Email enviado",
          description: "Se ha enviado un email de activación a tu correo electrónico.",
        });
      } else {
        toast({
          title: "Error al enviar email",
          description: "No se pudo enviar el email de activación. Intenta nuevamente.",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error sending activation email:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el email de activación.",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendWelcomeEmail = async (email: string, name: string) => {
    try {
      const success = await EmailService.sendWelcomeEmail(email, name);
      
      if (success) {
        console.log('Welcome email sent successfully');
      } else {
        console.error('Failed to send welcome email');
      }
      
      return success;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  };

  const sendReservationEmails = async (reservationData: ReservationEmailData, adminEmail: string) => {
    try {
      // Send email to customer
      const customerEmailSuccess = await EmailService.sendReservationCreatedEmail(reservationData);
      
      // Send email to admin
      const adminEmailData: AdminEmailData = {
        adminEmail,
        reservationId: reservationData.reservationId,
        customerName: reservationData.customerName,
        customerEmail: reservationData.customerEmail,
        totalAmount: reservationData.totalAmount,
        itemsCount: reservationData.items.length
      };
      
      const adminEmailSuccess = await EmailService.sendAdminNewReservationEmail(adminEmailData);
      
      if (customerEmailSuccess && adminEmailSuccess) {
        toast({
          title: "Emails enviados",
          description: "Se han enviado los emails de confirmación de reserva.",
        });
      } else {
        toast({
          title: "Error parcial",
          description: "La reserva se creó pero hubo problemas enviando algunos emails.",
          variant: "destructive",
        });
      }
      
      return { customerEmailSuccess, adminEmailSuccess };
    } catch (error) {
      console.error('Error sending reservation emails:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar los emails de reserva.",
        variant: "destructive",
      });
      return { customerEmailSuccess: false, adminEmailSuccess: false };
    }
  };

  const sendReservationConfirmedEmail = async (reservationData: ReservationEmailData) => {
    try {
      const success = await EmailService.sendReservationConfirmedEmail(reservationData);
      
      if (success) {
        toast({
          title: "Email enviado",
          description: "Se ha enviado el email de confirmación al cliente.",
        });
      } else {
        toast({
          title: "Error al enviar email",
          description: "No se pudo enviar el email de confirmación al cliente.",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el email de confirmación.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    sendAccountActivationEmail,
    sendWelcomeEmail,
    sendReservationEmails,
    sendReservationConfirmedEmail
  };
}; 