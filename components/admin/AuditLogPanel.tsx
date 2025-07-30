import React, { useState } from 'react';
import { useAuditLogs } from '@/hooks/useAudit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Filter, 
  Search, 
  Calendar,
  User,
  Database,
  RotateCcw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AuditLogPanel() {
  const [filters, setFilters] = useState({
    tableName: '',
    action: '',
    startDate: '',
    endDate: '',
    limit: 50
  });

  const { data: auditLogs, isLoading, refetch } = useAuditLogs(filters);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'STATUS_CHANGE':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'Creación';
      case 'UPDATE':
        return 'Actualización';
      case 'DELETE':
        return 'Eliminación';
      case 'STATUS_CHANGE':
        return 'Cambio de Estado';
      default:
        return action;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      case 'STATUS_CHANGE':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'reservations':
        return <Calendar className="h-4 w-4" />;
      case 'users':
        return <User className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getTableLabel = (tableName: string) => {
    switch (tableName) {
      case 'reservations':
        return 'Reservas';
      case 'users':
        return 'Usuarios';
      case 'products':
        return 'Productos';
      case 'zones':
        return 'Zonas';
      default:
        return tableName;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de Auditoría</h2>
          <p className="text-muted-foreground">
            Revisa todas las acciones realizadas en el sistema
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tabla */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tabla</label>
              <Select 
                value={filters.tableName} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, tableName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las tablas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las tablas</SelectItem>
                  <SelectItem value="reservations">Reservas</SelectItem>
                  <SelectItem value="users">Usuarios</SelectItem>
                  <SelectItem value="products">Productos</SelectItem>
                  <SelectItem value="zones">Zonas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acción */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Acción</label>
              <Select 
                value={filters.action} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las acciones</SelectItem>
                  <SelectItem value="INSERT">Creación</SelectItem>
                  <SelectItem value="UPDATE">Actualización</SelectItem>
                  <SelectItem value="DELETE">Eliminación</SelectItem>
                  <SelectItem value="STATUS_CHANGE">Cambio de Estado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha inicio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            {/* Fecha fin */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tabla</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>ID Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTableIcon(log.table_name)}
                          <Badge variant="outline">
                            {getTableLabel(log.table_name)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.description}>
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.admin_user_email ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{log.admin_user_email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {log.record_id.slice(0, 8)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay registros de auditoría disponibles</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Acciones</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cambios de Estado</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs?.filter(log => log.action === 'UPDATE' && log.changed_fields?.includes('status')).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Modificadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs?.filter(log => log.table_name === 'reservations').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 