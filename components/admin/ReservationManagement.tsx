import { useState } from 'react';
import { useReservations, useUpdateReservationStatus, useSystemSetting } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, Eye, CheckCircle, XCircle, AlertCircle, CalendarDays, MessageSquare, CreditCard, ArrowLeft, Phone, CloudRain, DollarSign, TrendingUp, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ReservationManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: reservations, isLoading } = useReservations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    startDate: dateFilter || undefined,
  });
  
  const { data: extraHourCostSetting } = useSystemSetting('extra_hour_cost');
  const extraHourCost = extraHourCostSetting ? Number(extraHourCostSetting.setting_value) : 5000;
  
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
      reservation.user_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user_profile?.phone?.includes(searchTerm);
    
    return matchesSearch;
  }) || [];

  // Calcular estadísticas
  const stats = {
    total: filteredReservations.length,
    pending: filteredReservations.filter(r => r.status === 'pending_payment').length,
    confirmed: filteredReservations.filter(r => r.status === 'confirmed').length,
    completed: filteredReservations.filter(r => r.status === 'paid').length, // Cambiado de 'completed' a 'paid'
    cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
    totalRevenue: filteredReservations
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + Number(r.total), 0),
    totalExtraHours: filteredReservations.reduce((sum, r) => sum + Number(r.extra_hours || 0), 0),
    extraHoursRevenue: filteredReservations.reduce((sum, r) => {
      const extraHoursCost = (r.extra_hours || 0) * extraHourCost;
      return sum + extraHoursCost;
    }, 0),
  };

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
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Reservas filtradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Esperando pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              Eventos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Solo confirmadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de horas extra */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Estadísticas de Horas Extra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalExtraHours}</div>
              <p className="text-sm text-muted-foreground">Horas extra totales</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${stats.extraHoursRevenue.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Ingresos por horas extra</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${extraHourCost.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Costo por hora extra</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros mejorados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por dirección, cliente o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros expandibles */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
              
              {(statusFilter !== 'all' || dateFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="reservationStatusFilter">Estado</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="reservationStatusFilter">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending_payment">Pendiente Pago</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="paid">Pagada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reservationDateFilter">Fecha del evento</Label>
                  <Input
                    id="reservationDateFilter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          {3 + reservation.extra_hours}h duración
                          {reservation.extra_hours > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">(+{reservation.extra_hours}h extra)</span>
                              <Badge variant="outline" className="text-xs">
                                +${(reservation.extra_hours * extraHourCost).toLocaleString()}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {reservation.rain_reschedule && (
                          <div className="flex items-center gap-1 text-sm">
                            <CloudRain className="h-4 w-4" />
                            {reservation.rain_reschedule === 'no' ? 'Sin reprogramación' :
                             reservation.rain_reschedule === 'indoor' ? 'Lugar techado' :
                             reservation.rain_reschedule === 'reschedule' ? 'Reprogramar' : 'No especificado'}
                          </div>
                        )}
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
                            <DialogDescription className="sr-only"> </DialogDescription>
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
                                extraHourCost={extraHourCost}
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
  onStatusUpdate,
  extraHourCost
}: { 
  reservation: any; 
  onStatusUpdate: (id: string, status: string) => void;
  extraHourCost: number;
}) {
  const getRainRescheduleLabel = (value: string) => {
    switch (value) {
      case 'no':
        return 'No reprogramar';
      case 'indoor':
        return 'Lugar techado disponible';
      case 'reschedule':
        return 'Reprogramar automáticamente';
      default:
        return 'No especificado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Información del Cliente */}
      <div>
        <h3 className="font-semibold mb-2">Información del Cliente</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Nombre:</span> {reservation.user_profile?.first_name} {reservation.user_profile?.last_name}
          </div>
          <div className="mb-2">
            <span className="font-medium">Teléfono:</span> {reservation.phone}
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
          <div>
            <span className="font-medium">Duración del evento:</span> {3 + reservation.extra_hours}h total
            {reservation.extra_hours > 0 && (
              <div className="mt-1">
                <span className="text-muted-foreground">(3h base + {reservation.extra_hours}h extra)</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Costo extra: ${(reservation.extra_hours * extraHourCost).toLocaleString()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ${extraHourCost.toLocaleString()}/hora
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <div className="col-span-2">
            <span className="font-medium flex items-center gap-1">
              <CloudRain className="h-4 w-4" />
              En caso de lluvia:
            </span>
            <span className="text-muted-foreground">{getRainRescheduleLabel(reservation.rain_reschedule || 'no')}</span>
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