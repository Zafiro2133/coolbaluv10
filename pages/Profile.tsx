import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Calendar, MapPin, Phone, Mail, Edit, Save, X, Package, Clock, ArrowLeft, CloudRain, FileText, ExternalLink, Eye } from 'lucide-react';
import { supabase } from '@/services/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Navigate, useNavigate } from 'react-router-dom';
import { getUserReservations } from '@/services/supabase/reservations';

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface Reservation {
  id: string;
  event_date: string;
  event_time: string;
  event_address: string;
  adult_count: number;
  child_count: number;
  status: string;
  total: number;
  subtotal: number;
  transport_cost: number;
  comments?: string;
  rain_reschedule?: string;
  extra_hours: number;
  created_at: string;
  phone: string;
  payment_proof_url?: string;
  reservation_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    extra_hours: number;
    item_total: number;
  }>;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
        });
      }

      // Fetch user reservations
      const { data: reservationsData, error: reservationsError } = await getUserReservations(user.id);

      if (reservationsError) throw reservationsError;

      // Normaliza reservation_items para que siempre sea un array
      const normalized = (reservationsData || []).map((r) => ({
        ...r,
        reservation_items: Array.isArray(r.reservation_items) ? r.reservation_items : [],
      }));

      setReservations(normalized);
    } catch (error: any) {
      // Solo mostrar el toast si el error NO es "no existe el perfil"
      if (!error?.code || error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información del perfil.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...formData,
          });

        if (error) throw error;
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada exitosamente.",
      });
      
      setIsEditing(false);
      fetchUserData();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información del perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { label: 'Pendiente Pago', variant: 'secondary' as const },
      confirmed: { label: 'Confirmada', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
      completed: { label: 'Completada', variant: 'outline' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_payment;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-32 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <p className="text-muted-foreground">
                  Gestioná tu información personal y revisá tu historial
                </p>
              </div>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setFormData({
                    first_name: profile?.first_name || '',
                    last_name: profile?.last_name || '',
                    phone: profile?.phone || '',
                    address: profile?.address || '',
                  });
                } else {
                  setIsEditing(true);
                }
              }}
              className="flex items-center gap-2"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {isEditing ? 'Cancelar' : 'Editar Perfil'}
            </Button>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reservas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombre</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Tu nombre"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellido</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Tu apellido"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        value={user.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El email no se puede modificar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Tu número de teléfono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Tu dirección"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Cuenta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fecha de registro:</span>
                      <p className="text-muted-foreground">
                        {profile ? format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: es }) : 'No disponible'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Última actualización:</span>
                      <p className="text-muted-foreground">
                        {profile ? format(new Date(profile.updated_at), 'dd MMMM yyyy', { locale: es }) : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Mis Reservas ({reservations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reservations.length > 0 ? (
                    <div className="space-y-4">
                      {reservations.map((reservation) => (
                        <Card key={reservation.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(reservation.event_date), 'dd MMMM yyyy', { locale: es })}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {reservation.event_time}
                                </p>
                              </div>
                              {getStatusBadge(reservation.status)}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <p className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {reservation.event_address}
                              </p>
                              <div className="mb-2">
                                <span className="font-medium">Teléfono:</span> {reservation.phone}
                              </div>
                              <p>
                                <span className="font-medium">Invitados:</span> {reservation.adult_count + reservation.child_count}
                                ({reservation.adult_count} adultos, {reservation.child_count} niños)
                              </p>
                              {reservation.extra_hours > 0 && (
                                <p>
                                  <span className="font-medium">Horas extra del evento:</span> +{reservation.extra_hours}h
                                </p>
                              )}
                              {reservation.comments && (
                                <p>
                                  <span className="font-medium">Comentarios:</span> {reservation.comments}
                                </p>
                              )}
                              {reservation.rain_reschedule && (
                                <p className="flex items-center gap-1">
                                  <CloudRain className="h-3 w-3" />
                                  <span className="font-medium">En caso de lluvia:</span> {getRainRescheduleLabel(reservation.rain_reschedule)}
                                </p>
                              )}
                            </div>

                            {reservation.reservation_items && reservation.reservation_items.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium mb-2 flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  Productos ({reservation.reservation_items.length})
                                </h4>
                                <div className="space-y-1">
                                  {reservation.reservation_items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                      <span>
                                        {item.product_name} x{item.quantity}
                                        {item.extra_hours > 0 && ` (+${item.extra_hours}h)`}
                                      </span>
                                      <span className="font-medium">${item.item_total.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mensaje de confirmación cuando la reserva está aprobada */}
                            {reservation.payment_proof_url && (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-sm">✓</span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-blue-900">¡Reserva Confirmada!</h4>
                                    <p className="text-sm text-blue-700">Tu evento ha sido confirmado exitosamente</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-3 text-sm text-blue-800">
                                  <p className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span><strong>Nos encontraremos en:</strong> {reservation.event_address}</span>
                                  </p>
                                  <p className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span><strong>Fecha y hora:</strong> {format(new Date(reservation.event_date), 'dd MMMM yyyy', { locale: es })} a las {reservation.event_time}</span>
                                  </p>
                                  <p className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span><strong>Llegaremos:</strong> Una hora antes para preparar todo</span>
                                  </p>
                                  <p className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span><strong>Equipo preparado para:</strong> {reservation.adult_count + reservation.child_count} invitados</span>
                                  </p>
                                  <p className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span><strong>Para cualquier consulta:</strong> Contactanos por WhatsApp</span>
                                  </p>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-blue-200">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Comprobante de Pago</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(reservation.payment_proof_url, '_blank')}
                                      className="flex items-center gap-1 text-blue-700 border-blue-300 hover:bg-blue-100"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Ver Comprobante
                                    </Button>
                                    
                                    {reservation.payment_proof_url.match(/\.(jpg|jpeg|png|webp)$/i) && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-1 text-blue-700 border-blue-300 hover:bg-blue-100"
                                          >
                                            <Eye className="h-3 w-3" />
                                            Vista Previa
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl">
                                          <DialogHeader>
                                            <DialogTitle>Comprobante de Pago</DialogTitle>
                                          </DialogHeader>
                                          <div className="flex justify-center">
                                            <img
                                              src={reservation.payment_proof_url}
                                              alt="Comprobante de pago"
                                              className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                            />
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-xs text-blue-600">
                                    {reservation.payment_proof_url.match(/\.(jpg|jpeg|png|webp)$/i) && (
                                      <div className="flex items-center gap-1">
                                        <span>•</span>
                                        <span>Imagen disponible</span>
                                      </div>
                                    )}
                                    {reservation.payment_proof_url.match(/\.pdf$/i) && (
                                      <div className="flex items-center gap-1">
                                        <span>•</span>
                                        <span>PDF disponible</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="border-t pt-3 mt-4">
                              <div className="flex justify-between items-center">
                                <div className="text-sm">
                                  <p>Subtotal: ${reservation.subtotal.toLocaleString()}</p>
                                  {reservation.transport_cost > 0 && (
                                    <p>Transporte: ${reservation.transport_cost.toLocaleString()}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">${reservation.total.toLocaleString()}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(reservation.created_at), 'dd MMM yyyy', { locale: es })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No tienes reservas registradas
                      </p>
                      <Button onClick={() => window.location.href = '/catalog'}>
                        Explorar Catálogo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}