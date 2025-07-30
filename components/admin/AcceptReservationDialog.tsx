import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUpdateReservationStatus } from '@/hooks/useAdmin';
import { PaymentProofUpload } from '@/components/ui/payment-proof-upload';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface AcceptReservationDialogProps {
  reservation: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AcceptReservationDialog({
  reservation,
  isOpen,
  onClose,
  onSuccess
}: AcceptReservationDialogProps) {
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const updateStatusMutation = useUpdateReservationStatus();
  const { toast } = useToast();

  const handleUploadSuccess = (url: string) => {
    setPaymentProofUrl(url);
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  const handleAutoConfirm = async (url: string) => {
    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        reservationId: reservation.id,
        status: 'confirmed',
        paymentProofUrl: url,
      });

      setIsConfirmed(true);
      onSuccess();
      
      // Cerrar el diálogo después de un breve delay para mostrar el mensaje de éxito
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      throw error; // Re-lanzar el error para que se maneje en el componente PaymentProofUpload
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPaymentProofUrl(null);
      setUploadError(null);
      setIsConfirmed(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Subir Comprobante y Confirmar Reserva
          </DialogTitle>
          <DialogDescription>
            Sube el comprobante de pago para confirmar automáticamente la reserva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la reserva */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Detalles de la Reserva</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Cliente:</span> {reservation.user_profile?.first_name} {reservation.user_profile?.last_name}
              </div>
              <div>
                <span className="font-medium">Teléfono:</span> {reservation.user_profile?.phone}
              </div>
              <div>
                <span className="font-medium">Fecha:</span> {reservation.event_date}
              </div>
              <div>
                <span className="font-medium">Hora:</span> {reservation.event_time}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Dirección:</span> {reservation.event_address}
              </div>
              <div>
                <span className="font-medium">Total:</span> ${reservation.total.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Personas:</span> {reservation.adult_count + reservation.child_count}
              </div>
            </div>
          </div>

          {/* Mensaje de confirmación exitosa */}
          {isConfirmed && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>¡Reserva confirmada exitosamente!</strong> La reserva ha sido confirmada y el comprobante ha sido guardado.
                El cliente recibirá una notificación automática.
              </AlertDescription>
            </Alert>
          )}

          {/* Comprobante existente */}
          {reservation.payment_proof_url && !isConfirmed && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Comprobante existente:</strong> Esta reserva ya tiene un comprobante de pago subido.
                Puedes subir uno nuevo si es necesario.
              </AlertDescription>
            </Alert>
          )}

          {/* Componente de subida de comprobante */}
          {!isConfirmed && (
            <PaymentProofUpload
              reservationId={reservation.id}
              userId={reservation.user_id}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              existingProofUrl={reservation.payment_proof_url}
              disabled={isSubmitting}
              autoConfirmOnUpload={true}
              onAutoConfirm={handleAutoConfirm}
            />
          )}

          {/* Error de subida */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al subir el archivo: {uploadError}
              </AlertDescription>
            </Alert>
          )}

          {/* Información adicional */}
          {!isConfirmed && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Proceso automático:</strong>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>Sube el comprobante de pago (imagen o PDF)</li>
                  <li>Verifica que el archivo sea legible</li>
                  <li>La reserva se confirmará automáticamente al subir el comprobante</li>
                  <li>El cliente recibirá una notificación automática</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {isConfirmed ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 