import { useState } from 'react';
import { useReservations, useUpdateReservationStatus, useDeleteReservation, useSystemSetting } from '@/hooks/useAdmin';
import { useAdminContext } from '@/hooks/useAdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, Eye, CheckCircle, XCircle, AlertCircle, CalendarDays, MessageSquare, CreditCard, ArrowLeft, Phone, CloudRain, DollarSign, TrendingUp, Filter, Search, Trash2, Download, RefreshCw, MoreHorizontal, Edit, Copy, Archive, FileText, BarChart3, Grid, List, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AcceptReservationDialog } from './AcceptReservationDialog';

export function ReservationManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [reservationToAccept, setReservationToAccept] = useState<any>(null);
  
  const { user, isAdmin, isLoading: adminLoading } = useAdminContext();
  
  const { data: reservations, isLoading, refetch } = useReservations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    startDate: dateFilter || undefined,
    endDate: endDateFilter || undefined,
  });
  
  const { data: extraHourCostSetting } = useSystemSetting('extra_hour_cost');
  const extraHourCost = extraHourCostSetting ? Number(extraHourCostSetting.setting_value) : 5000;
  
  const updateStatusMutation = useUpdateReservationStatus();
  const deleteReservationMutation = useDeleteReservation();
  const { toast } = useToast();

  // Verificar que el usuario es admin
  if (adminLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tienes permisos de administrador.</p>
      </div>
    );
  }

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

  const handleAcceptWithProof = (reservation: any) => {
    setReservationToAccept(reservation);
    setAcceptDialogOpen(true);
  };

  const handleAcceptSuccess = () => {
    refetch();
  };

  const handleDeleteReservation = async (reservationId: string) => {
    try {
      await deleteReservationMutation.mutateAsync(reservationId);
      toast({
        title: "Reserva eliminada",
        description: "La reserva ha sido eliminada correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la reserva.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { label: 'Pendiente Pago', variant: 'secondary' as const, icon: AlertCircle, color: 'text-amber-600' },
      confirmed: { label: 'Confirmada', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600' },
      paid: { label: 'Pagada', variant: 'default' as const, icon: CreditCard, color: 'text-purple-600' },
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
      reservation.user_profile?.phone?.includes(searchTerm) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  // Ordenar reservas
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginación
  const totalPages = Math.ceil(sortedReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReservations = sortedReservations.slice(startIndex, startIndex + itemsPerPage);

  // Calcular estadísticas
  const stats = {
    total: filteredReservations.length,
    pending: filteredReservations.filter(r => r.status === 'pending_payment').length,
    confirmed: filteredReservations.filter(r => r.status === 'confirmed').length,
    completed: filteredReservations.filter(r => r.status === 'completed').length,
    paid: filteredReservations.filter(r => r.status === 'paid').length,
    cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
    totalRevenue: filteredReservations
      .filter(r => ['confirmed', 'completed', 'paid'].includes(r.status))
      .reduce((sum, r) => sum + Number(r.total), 0),
    totalExtraHours: filteredReservations.reduce((sum, r) => sum + Number(r.extra_hours || 0), 0),
    extraHoursRevenue: filteredReservations.reduce((sum, r) => {
      const extraHoursCost = (r.extra_hours || 0) * extraHourCost;
      return sum + extraHoursCost;
    }, 0),
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Cliente', 'Teléfono', 'Fecha', 'Hora', 'Dirección', 'Estado', 'Total', 'Adultos', 'Niños', 'Horas Extra'];
    const csvContent = [
      headers.join(','),
      ...filteredReservations.map(r => [
        r.id,
        `${r.user_profile?.first_name || ''} ${r.user_profile?.last_name || ''}`,
        r.user_profile?.phone || '',
        r.event_date,
        r.event_time,
        `"${r.event_address}"`,
        r.status,
        r.total,
        r.adult_count,
        r.child_count,
        r.extra_hours || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reservas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              Confirmadas y completadas
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

      {/* Controles principales */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Gestión de Reservas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, dirección, cliente o teléfono..."
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
              
              {(statusFilter !== 'all' || dateFilter || endDateFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('');
                    setEndDateFilter('');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
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
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reservationDateFilter">Fecha desde</Label>
                  <Input
                    id="reservationDateFilter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservationEndDateFilter">Fecha hasta</Label>
                  <Input
                    id="reservationEndDateFilter"
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortBy">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sortBy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Fecha de creación</SelectItem>
                      <SelectItem value="event_date">Fecha del evento</SelectItem>
                      <SelectItem value="total">Total</SelectItem>
                      <SelectItem value="status">Estado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista de reservas */}
      {viewMode === 'table' ? (
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
                  {paginatedReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div className="font-medium">
                          {reservation.user_profile?.first_name} {reservation.user_profile?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {reservation.user_profile?.phone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {reservation.id.slice(0, 8)}...
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
                          {reservation.extra_hours > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4" />
                              +{reservation.extra_hours}h extra
                              <Badge variant="outline" className="text-xs">
                                +${(reservation.extra_hours * extraHourCost).toLocaleString()}
                              </Badge>
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
                                  onDelete={handleDeleteReservation}
                                  extraHourCost={extraHourCost}
                                  onAcceptWithProof={handleAcceptWithProof}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {reservation.status === 'pending_payment' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptWithProof(reservation)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Aceptar y subir comprobante
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

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleteReservationMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente la reserva y todos sus datos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReservation(reservation.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredReservations.length)} de {filteredReservations.length} reservas
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Vista en grid
        <Card>
          <CardHeader>
            <CardTitle>Reservas ({filteredReservations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedReservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {reservation.user_profile?.first_name} {reservation.user_profile?.last_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {reservation.user_profile?.phone}
                        </p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(reservation.event_date), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {reservation.event_time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{reservation.event_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {reservation.adult_count + reservation.child_count} personas
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">${reservation.total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReservation(reservation)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
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
                              onDelete={handleDeleteReservation}
                              extraHourCost={extraHourCost}
                              onAcceptWithProof={handleAcceptWithProof}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteReservationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la reserva y todos sus datos asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteReservation(reservation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación para grid */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredReservations.length)} de {filteredReservations.length} reservas
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo de aceptar y subir comprobante */}
      {reservationToAccept && (
        <AcceptReservationDialog
          reservation={reservationToAccept}
          isOpen={acceptDialogOpen}
          onClose={() => {
            setAcceptDialogOpen(false);
            setReservationToAccept(null);
          }}
          onSuccess={handleAcceptSuccess}
        />
      )}
    </div>
  );
}

function ReservationDetails({ 
  reservation, 
  onStatusUpdate,
  onDelete,
  extraHourCost,
  onAcceptWithProof
}: { 
  reservation: any; 
  onStatusUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  extraHourCost: number;
  onAcceptWithProof: (reservation: any) => void;
}) {
  const getRainRescheduleLabel = (value: string) => {
    switch (value) {
      case 'no':
        return 'Tengo un espacio cubierto para el evento';
      case 'reschedule':
        return 'Reprogramar automáticamente. Si llueve reprogramamos para otra fecha';
      default:
        return 'No especificado';
    }
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Detalles</TabsTrigger>
        <TabsTrigger value="products">Productos</TabsTrigger>
        <TabsTrigger value="actions">Acciones</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-6">
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

        {/* Comprobante de Pago */}
        {reservation.payment_proof_url && (
          <div>
            <h3 className="font-semibold mb-2">Comprobante de Pago</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Comprobante subido
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(reservation.payment_proof_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Ver comprobante
                </Button>
              </div>
              {reservation.payment_proof_url.match(/\.(jpg|jpeg|png|webp)$/i) && (
                <div className="mt-2">
                  <img
                    src={reservation.payment_proof_url}
                    alt="Comprobante de pago"
                    className="w-full max-w-md h-auto rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="products" className="space-y-4">
        <h3 className="font-semibold">Productos Reservados</h3>
        <div className="space-y-2">
          {reservation.reservation_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <span className="font-medium">{item.product_name}</span>
                <div className="text-sm text-muted-foreground">
                  Cantidad: {item.quantity}
                  {item.extra_hours > 0 && ` • +${item.extra_hours}h extra`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${item.item_total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  ${item.product_price.toLocaleString()}/unidad
                </div>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="actions" className="space-y-4">
        <h3 className="font-semibold">Acciones Rápidas</h3>
        

        
        {/* Cambiar Estado */}
        <div>
          <h4 className="font-medium mb-2">Cambiar Estado</h4>
          <div className="flex gap-2 flex-wrap">
            {reservation.status === 'pending_payment' && (
              <Button
                onClick={() => onAcceptWithProof(reservation)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Aceptar y subir comprobante
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

        {/* Eliminar Reserva */}
        <div>
          <h4 className="font-medium mb-2 text-destructive">Acciones Destructivas</h4>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Reserva
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la reserva y todos sus datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(reservation.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TabsContent>
    </Tabs>
  );
}