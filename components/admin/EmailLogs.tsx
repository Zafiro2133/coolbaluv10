import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getEmailLogsForAdmin, updateEmailLogStatus } from '@/services/email';
import { Mail, Search, Filter, Eye, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

interface EmailLog {
  id: string;
  email_type: 'reservation_confirmation' | 'reservation_update' | 'contact_form' | 'admin_notification' | 'payment_confirmation';
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  error_message?: string;
  metadata?: Record<string, any>;
  related_reservation_id?: string;
  related_contact_message_id?: string;
  sent_at: string;
  created_at: string;
}

export default function EmailLogs() {
  const { toast } = useToast();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    emailType: 'all',
    status: 'all',
    recipientEmail: '',
    limit: 50
  });
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Cargar logs de email
  const loadEmailLogs = async () => {
    setLoading(true);
    try {
      const logs = await getEmailLogsForAdmin({
        emailType: filters.emailType === 'all' ? undefined : filters.emailType,
        status: filters.status === 'all' ? undefined : filters.status,
        recipientEmail: filters.recipientEmail || undefined,
        limit: filters.limit
      });

      if (logs) {
        setEmailLogs(logs);
      } else {
        setEmailLogs([]);
      }
    } catch (error) {
      console.error('Error al cargar logs de email:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los logs de email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailLogs();
  }, [filters]);

  // Obtener color del badge según el tipo de email
  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case 'reservation_confirmation':
        return 'bg-blue-100 text-blue-800';
      case 'contact_form':
        return 'bg-orange-100 text-orange-800';
      case 'payment_confirmation':
        return 'bg-green-100 text-green-800';
      case 'admin_notification':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener color del badge según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener icono según el estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Ver contenido del email
  const viewEmailContent = (log: EmailLog) => {
    setSelectedLog(log);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Logs de Email
          </CardTitle>
          <CardDescription>
            Historial de emails enviados y su estado
          </CardDescription>
        </CardHeader>
        <CardContent>
                     {/* Filtros */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
             <div>
               <Label htmlFor="emailTypeFilter">Tipo de Email</Label>
               <Select
                 value={filters.emailType}
                 onValueChange={(value) => setFilters(prev => ({ ...prev, emailType: value }))}
               >
                 <SelectTrigger id="emailTypeFilter">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos los tipos</SelectItem>
                   <SelectItem value="reservation_confirmation">Confirmación de Reserva</SelectItem>
                   <SelectItem value="contact_form">Formulario de Contacto</SelectItem>
                   <SelectItem value="payment_confirmation">Confirmación de Pago</SelectItem>
                   <SelectItem value="admin_notification">Notificación de Admin</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div>
               <Label htmlFor="statusFilter">Estado</Label>
               <Select
                 value={filters.status}
                 onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
               >
                 <SelectTrigger id="statusFilter">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos los estados</SelectItem>
                   <SelectItem value="sent">Enviado</SelectItem>
                   <SelectItem value="failed">Fallido</SelectItem>
                   <SelectItem value="pending">Pendiente</SelectItem>
                   <SelectItem value="bounced">Rebotado</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div>
               <Label htmlFor="recipientEmailFilter">Email Destinatario</Label>
               <Input
                 id="recipientEmailFilter"
                 name="recipientEmailFilter"
                 placeholder="Buscar por email..."
                 value={filters.recipientEmail}
                 onChange={(e) => setFilters(prev => ({ ...prev, recipientEmail: e.target.value }))}
               />
             </div>

            <div className="flex items-end">
              <Button onClick={loadEmailLogs} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Tabla de logs */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Cargando logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : emailLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron logs de email
                    </TableCell>
                  </TableRow>
                ) : (
                  emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.sent_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getEmailTypeColor(log.email_type)}>
                          {log.email_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <div className="font-medium">{log.recipient_email}</div>
                          {log.recipient_name && (
                            <div className="text-muted-foreground text-xs">
                              {log.recipient_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(log.status)}
                            {log.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewEmailContent(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalles del Email</DialogTitle>
                              <DialogDescription>
                                Información completa del email enviado
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">ID del Log</label>
                                  <p className="text-sm text-muted-foreground">{log.id}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Fecha de Envío</label>
                                  <p className="text-sm text-muted-foreground">{formatDate(log.sent_at)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Tipo</label>
                                  <Badge className={getEmailTypeColor(log.email_type)}>
                                    {log.email_type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Estado</label>
                                  <Badge className={getStatusColor(log.status)}>
                                    {log.status}
                                  </Badge>
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <label className="text-sm font-medium">Destinatario</label>
                                <p className="text-sm text-muted-foreground">{log.recipient_email}</p>
                                {log.recipient_name && (
                                  <p className="text-sm text-muted-foreground">{log.recipient_name}</p>
                                )}
                              </div>

                              <div>
                                <label className="text-sm font-medium">Asunto</label>
                                <p className="text-sm text-muted-foreground">{log.subject}</p>
                              </div>

                              {log.error_message && (
                                <div>
                                  <label className="text-sm font-medium text-red-600">Error</label>
                                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                    {log.error_message}
                                  </p>
                                </div>
                              )}

                              {log.related_reservation_id && (
                                <div>
                                  <label className="text-sm font-medium">ID de Reserva Relacionada</label>
                                  <p className="text-sm text-muted-foreground">{log.related_reservation_id}</p>
                                </div>
                              )}

                              {log.related_contact_message_id && (
                                <div>
                                  <label className="text-sm font-medium">ID de Mensaje de Contacto</label>
                                  <p className="text-sm text-muted-foreground">{log.related_contact_message_id}</p>
                                </div>
                              )}

                              <Separator />

                              <div>
                                <label className="text-sm font-medium">Contenido del Email</label>
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                  <div 
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: log.content }}
                                  />
                                </div>
                              </div>

                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <>
                                  <Separator />
                                  <div>
                                    <label className="text-sm font-medium">Metadatos</label>
                                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                </>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumen */}
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {emailLogs.length} logs de email
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 