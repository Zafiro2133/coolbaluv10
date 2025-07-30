import React, { useState } from 'react';
import { useReservationHistory, useRevertReservationStatus } from '@/hooks/useAudit';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  RotateCcw, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReservationHistoryProps {
  reservationId: string;
  currentStatus: string;
  onStatusReverted?: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'confirmed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return 'Pendiente de Pago';
    case 'confirmed':
      return 'Confirmada';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return 'secondary';
    case 'confirmed':
      return 'default';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function ReservationHistory({ 
  reservationId, 
  currentStatus, 
  onStatusReverted 
}: ReservationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { user } = useAuth();
  
  const { data: history, isLoading, error, refetch } = useReservationHistory(reservationId);
  const revertMutation = useRevertReservationStatus();

  const handleRevert = async () => {
    if (!user?.id || !selectedStatus) return;

    try {
      await revertMutation.mutateAsync({
        reservationId,
        targetStatus: selectedStatus,
        adminUserId: user.id
      });
      
      setIsOpen(false);
      setSelectedStatus('');
      onStatusReverted?.();
      refetch();
    } catch (error) {
      console.error('Error al revertir estado:', error);
    }
  };

  const availableStatuses = history
    ?.filter(item => item.new_status && item.new_status !== currentStatus)
    ?.map(item => item.new_status)
    ?.filter((status, index, arr) => arr.indexOf(status) === index) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Historial
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios
          </DialogTitle>
          <DialogDescription>
            Revisa todos los cambios realizados en esta reserva y revierte si es necesario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado actual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(currentStatus)}
                <Badge variant={getStatusBadgeVariant(currentStatus)}>
                  {getStatusLabel(currentStatus)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Opciones de reversión */}
          {availableStatuses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Revertir a Estado Anterior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Selecciona un estado anterior para revertir:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableStatuses.map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStatus(status)}
                        className="gap-2"
                      >
                        {getStatusIcon(status)}
                        {getStatusLabel(status)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de cambios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Historial Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Cargando historial...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-red-600 font-medium">Error al cargar el historial</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {error.message || 'Error desconocido'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetch()}
                      className="mt-2"
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : history && history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.new_status)}
                            <div>
                              <p className="text-sm font-medium">
                                {item.description}
                              </p>
                                                             <p className="text-xs text-muted-foreground">
                                 {format(new Date(item.change_timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                               </p>
                            </div>
                          </div>
                          {item.admin_user_email && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {item.admin_user_email}
                            </Badge>
                          )}
                        </div>
                        
                        {item.old_status && item.new_status && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>De:</span>
                            <Badge variant="outline" className="text-xs">
                              {getStatusLabel(item.old_status)}
                            </Badge>
                            <span>→</span>
                            <Badge variant="outline" className="text-xs">
                              {getStatusLabel(item.new_status)}
                            </Badge>
                          </div>
                        )}
                        
                        {index < history.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay historial disponible</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
          
          {selectedStatus && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={revertMutation.isPending}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revertir a {getStatusLabel(selectedStatus)}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Confirmar Reversión
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres revertir el estado de esta reserva a "{getStatusLabel(selectedStatus)}"?
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleRevert}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmar Reversión
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 