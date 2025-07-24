import { useState } from 'react';
import { useReservations, useUpdateReservationStatus } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ReservationManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  
  const { data: reservations, isLoading } = useReservations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    startDate: dateFilter || undefined,
  });
  
  const updateStatusMutation = useUpdateReservationStatus();
  const { toast } = useToast();

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        reservationId: reservationId,
        status: newStatus,
      });
      toast({
        title: "Estado actualizado",
        description: "El estado de la reserva ha sido actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la reserva.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { label: 'Pendiente Pago', variant: 'secondary' as const, icon: AlertCircle },
      confirmed: { label: 'Confirmada', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_payment;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredReservations = reservations?.filter(reservation => {
    const matchesSearch = searchTerm === '' || 
      reservation.event_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Gestión de Reservas</h2>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Buscar por dirección o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending_payment">Pendiente Pago</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="md:w-48"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservas ({filteredReservations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div className="font-medium">
                        {reservation.user_profile?.first_name} {reservation.user_profile?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reservation.user_profile?.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(reservation.event_date), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          {reservation.event_time}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4" />
                          {reservation.event_address.length > 30 
                            ? `${reservation.event_address.substring(0, 30)}...`
                            : reservation.event_address
                          }
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          {reservation.adult_count + reservation.child_count} personas
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.status)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${reservation.total.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReservation(reservation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalles de la Reserva</DialogTitle>
                              <DialogDescription>
                                Información detallada de la reserva seleccionada
                              </DialogDescription>
                            </DialogHeader>
                            {selectedReservation && (
                              <ReservationDetails 
                                reservation={selectedReservation}
                                onStatusUpdate={handleStatusUpdate}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {reservation.status === 'pending_payment' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {reservation.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                            disabled={updateStatusMutation.isPending}
                          >
                            Completar
                          </Button>
                        )}
                        
                        {['pending_payment', 'confirmed'].includes(reservation.status) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredReservations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron reservas con los filtros seleccionados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReservationDetails({ 
  reservation, 
  onStatusUpdate 
}: { 
  reservation: any; 
  onStatusUpdate: (id: string, status: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Información del Cliente */}
      <div>
        <h3 className="font-semibold mb-2">Información del Cliente</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Nombre:</span> {reservation.user_profile?.first_name} {reservation.user_profile?.last_name}
          </div>
          <div>
            <span className="font-medium">Teléfono:</span> {reservation.user_profile?.phone || 'No proporcionado'}
          </div>
        </div>
      </div>

      {/* Información del Evento */}
      <div>
        <h3 className="font-semibold mb-2">Detalles del Evento</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Fecha:</span> {format(new Date(reservation.event_date), 'dd MMMM yyyy', { locale: es })}
          </div>
          <div>
            <span className="font-medium">Hora:</span> {reservation.event_time}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Dirección del evento:</span> {reservation.event_address}
          </div>
          <div>
            <span className="font-medium">Adultos:</span> {reservation.adult_count}
          </div>
          <div>
            <span className="font-medium">Niños:</span> {reservation.child_count}
          </div>
          {reservation.comments && (
            <div className="col-span-2">
              <span className="font-medium">Comentarios:</span> {reservation.comments}
            </div>
          )}
        </div>
      </div>

      {/* Productos Reservados */}
      <div>
        <h3 className="font-semibold mb-2">Productos Reservados</h3>
        <div className="space-y-2">
          {reservation.reservation_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
              <div>
                <span className="font-medium">{item.product_name}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  x{item.quantity}
                  {item.extra_hours > 0 && ` (+${item.extra_hours}h extra)`}
                </span>
              </div>
              <span className="font-medium">${item.item_total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de Costos */}
      <div>
        <h3 className="font-semibold mb-2">Resumen de Costos</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${reservation.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Transporte:</span>
            <span>${reservation.transport_cost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Total:</span>
            <span>${reservation.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h3 className="font-semibold mb-2">Cambiar Estado</h3>
        <div className="flex gap-2 flex-wrap">
          {reservation.status === 'pending_payment' && (
            <Button
              onClick={() => onStatusUpdate(reservation.id, 'confirmed')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Confirmar Reserva
            </Button>
          )}
          
          {reservation.status === 'confirmed' && (
            <Button
              onClick={() => onStatusUpdate(reservation.id, 'completed')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Marcar como Completada
            </Button>
          )}
          
          {['pending_payment', 'confirmed'].includes(reservation.status) && (
            <Button
              onClick={() => onStatusUpdate(reservation.id, 'cancelled')}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Cancelar Reserva
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}