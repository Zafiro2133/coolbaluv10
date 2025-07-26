import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useCartItems, calculateItemTotal, calculateCartSubtotal, useClearCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/client';
import { CalendarDays, Clock, MapPin, Users, MessageSquare, CreditCard, AlertCircle, Calendar as CalendarIcon, ArrowLeft, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/utils/utils';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useCartContext } from '@/contexts/CartContext';
import { createReservation, createReservationItems } from '@/services/supabase/reservations';

// Utilidad para validar si un objeto es un Polygon o MultiPolygon GeoJSON
function isGeoJsonPolygon(obj: any): obj is { type: 'Polygon' | 'MultiPolygon'; coordinates: any } {
  return obj && typeof obj === 'object' && (obj.type === 'Polygon' || obj.type === 'MultiPolygon') && Array.isArray(obj.coordinates);
}

export default function Reservation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: cartItems = [] } = useCartItems();
  const clearCart = useClearCart();

  // Obtener costo fijo de traslado y montaje
  const transportCost = Number(localStorage.getItem('transportCost')) || 0;

  const subtotal = calculateCartSubtotal(cartItems);
  const total = subtotal + transportCost;

  // Usar valores vacíos para dirección (ya no se usa para zona)
  const [formData, setFormData] = useState({
    eventDate: null as Date | null,
    eventTime: '',
    street: '',
    number: '',
    city: '',
    phone: '',
    adultCount: 1,
    childCount: 0,
    comments: ''
  });

  const [availabilities, setAvailabilities] = useState<{ date: string; hour: string }[]>([]);
  const [availableDateStrings, setAvailableDateStrings] = useState<string[]>([]); // YYYY-MM-DD
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [loadingAvailabilities, setLoadingAvailabilities] = useState(true);
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null); // YYYY-MM-DD
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
    
    if (cartItems.length === 0) {
      navigate('/');
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de hacer una reserva",
        variant: "destructive",
      });
    }
  }, [user, cartItems.length, navigate, toast]);

  React.useEffect(() => {
    // Cargar disponibilidades del admin
    const fetchAvailabilities = async () => {
      setLoadingAvailabilities(true);
      const { data, error } = await supabase
        .from('availabilities')
        .select('*');
      if (!error && data) {
        setAvailabilities(data);
        // Extraer fechas únicas como strings
        const uniqueDateStrings = Array.from(new Set(data.map((d: any) => d.date)));
        setAvailableDateStrings(uniqueDateStrings);
      }
      setLoadingAvailabilities(false);
    };
    fetchAvailabilities();
  }, []);

  // Actualizar horas disponibles cuando cambia la fecha seleccionada
  React.useEffect(() => {
    if (selectedDateString) {
      const hours = availabilities
        .filter(a => a.date === selectedDateString)
        .map(a => {
          // Forzar formato HH:mm
          let h = a.hour;
          if (/^\d{1,2}$/.test(h)) return h.padStart(2, '0') + ':00';
          if (/^\d{1,2}:[0-5]\d$/.test(h)) {
            const [hh, mm] = h.split(':');
            return hh.padStart(2, '0') + ':' + mm;
          }
          return h;
        });
      setAvailableHours(hours);
      // Si la hora seleccionada ya no está disponible, resetear
      if (!hours.includes(formData.eventTime)) {
        setFormData(prev => ({ ...prev, eventTime: '' }));
      }
    } else {
      setAvailableHours([]);
      setFormData(prev => ({ ...prev, eventTime: '' }));
    }
  }, [selectedDateString, availabilities]);

  // Cuando el usuario selecciona una fecha en el calendario
  const handleDateSelect = (date: Date | null) => {
    if (!date) {
      setFormData(prev => ({ ...prev, eventDate: null }));
      setSelectedDateString(null);
      return;
    }
    // Convertir la fecha seleccionada a string YYYY-MM-DD en local
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setFormData(prev => ({ ...prev, eventDate: date }));
    setSelectedDateString(dateString);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  function handleInputChange(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value.toString() }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsSubmitting(true);
    if (!formData.eventTime) {
      setIsSubmitting(false);
      toast({
        title: 'Falta horario',
        description: 'Debes seleccionar un horario para el evento',
        variant: 'destructive',
      });
      return;
    }
    const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.eventTime);
    if (!validTime) {
      setIsSubmitting(false);
      toast({
        title: 'Horario inválido',
        description: 'Selecciona un horario válido para el evento (formato HH:mm)',
        variant: 'destructive',
      });
      return;
    }
    try {
      const fullAddress = `${formData.street} ${formData.number}, ${formData.city}`;
      // Usar selectedDateString para guardar la fecha exacta seleccionada
      const reservationData = {
        user_id: user.id,
        event_date: selectedDateString || '',
        event_time: formData.eventTime,
        event_address: fullAddress,
        zone_id: null, // No se usa zona
        phone: formData.phone,
        adult_count: formData.adultCount,
        child_count: formData.childCount,
        comments: formData.comments,
        subtotal,
        transport_cost: transportCost, // Nuevo campo
        total,
        status: 'pending_payment'
      };

      const { data, error } = await createReservation(reservationData);
      if (error) throw error;

      // Create reservation items
      const reservationItems = cartItems.map(item => ({
        reservation_id: data.id, // Usar el ID de la reserva creada
        product_id: item.product_id,
        product_name: item.product?.name || '',
        product_price: item.product?.base_price || 0,
        quantity: item.quantity,
        extra_hours: item.extra_hours,
        extra_hour_percentage: item.product?.extra_hour_percentage || 0,
        item_total: calculateItemTotal(item)
      }));

      const { error: itemsError } = await createReservationItems(reservationItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart.mutateAsync();

      toast({
        title: "¡Reserva creada!",
        description: "Tu reserva se creó exitosamente. Te contactaremos pronto.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Error al crear reserva",
        description: "Ocurrió un error. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || cartItems.length === 0) {
    return null;
  }

  // Justo antes del render, filtrar horas duplicadas:
  const uniqueAvailableHours = Array.from(new Set(availableHours));

  return (
    <div className="min-h-screen bg-background">
      
      <main className="pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Completar Reserva
            </h1>
            <p className="text-muted-foreground">
              Completá los datos de la fiesta para confirmar tu reserva
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Datos del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventDatePicker">
                        <CalendarDays className="inline h-4 w-4 mr-1" />
                        Fecha del evento
                      </Label>
                      <label htmlFor="eventDatePicker" className="text-sm font-medium sr-only">
                        Fecha del evento
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="eventDatePicker"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal min-h-[40px]",
                              !formData.eventDate && "text-muted-foreground"
                            )}
                            disabled={loadingAvailabilities}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {formData.eventDate ? (
                                format(formData.eventDate, "PPP", { locale: es })
                              ) : (
                                loadingAvailabilities ? "Cargando..." : "Selecciona una fecha"
                              )}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.eventDate || undefined}
                            onSelect={handleDateSelect}
                            disabled={(date) => {
                              const year = date.getFullYear();
                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
                              const day = date.getDate().toString().padStart(2, '0');
                              const dateString = `${year}-${month}-${day}`;
                              return !availableDateStrings.includes(dateString);
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventTimeSelect">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Hora del evento
                      </Label>
                      <label htmlFor="eventTimeSelect" className="text-sm font-medium sr-only">
                        Hora del evento
                      </label>
                      <Select
                        value={formData.eventTime}
                        onValueChange={(value) => handleInputChange('eventTime', value)}
                        disabled={!selectedDateString || uniqueAvailableHours.length === 0}
                      >
                        <SelectTrigger className="w-full" id="eventTimeSelect">
                          <SelectValue placeholder={
                            !selectedDateString
                              ? "Selecciona una fecha primero"
                              : uniqueAvailableHours.length === 0
                                ? "No hay horas disponibles"
                                : "Selecciona una hora"
                          } />
                        </SelectTrigger>
                        {uniqueAvailableHours.length > 0 && (
                          <SelectContent>
                            {uniqueAvailableHours.map((hour) => (
                              <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                            ))}
                          </SelectContent>
                        )}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Dirección de la fiesta
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <div>
                        <label htmlFor="street" className="text-sm font-medium sr-only">
                          Calle
                        </label>
                        <Input
                          id="street"
                          name="street"
                          autoComplete="street-address"
                          placeholder="Calle (ej: San Martín)"
                          value={formData.street?.toString() ?? ''}
                          onChange={(e) => handleInputChange('street', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="number" className="text-sm font-medium sr-only">
                          Altura
                        </label>
                        <Input
                          id="number"
                          name="number"
                          autoComplete="address-line2"
                          placeholder="Altura (ej: 1234)"
                          value={formData.number?.toString() ?? ''}
                          onChange={(e) => handleInputChange('number', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="text-sm font-medium sr-only">
                          Ciudad
                        </label>
                        <Input
                          id="city"
                          name="city"
                          autoComplete="address-level2"
                          placeholder="Ciudad"
                          value={formData.city?.toString() ?? ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {/* Resultado de zona */}
                    {/* No hay lógica de zona, solo se muestra la dirección */}
                    <div className="text-sm">
                      Dirección de la fiesta: <b>{`${formData.street} ${formData.number}, ${formData.city}`}</b>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adultCount">
                        <Users className="inline h-4 w-4 mr-1" />
                        Cantidad de adultos
                      </Label>
                      <div className="flex items-center gap-2">
                        <label htmlFor="adultCount" className="text-sm font-medium sr-only">
                          Cantidad de adultos
                        </label>
                        <Input
                          type="number"
                          id="adultCount"
                          name="adultCount"
                          autoComplete="off"
                          min={1}
                          className="w-16 text-center"
                          value={formData.adultCount}
                          onChange={e => {
                            const value = Math.max(1, parseInt(e.target.value) || 1);
                            handleInputChange('adultCount', value);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="childCount">
                        <Users className="inline h-4 w-4 mr-1" />
                        Cantidad de niños
                      </Label>
                      <div className="flex items-center gap-2">
                        <label htmlFor="childCount" className="text-sm font-medium sr-only">
                          Cantidad de niños
                        </label>
                        <Input
                          type="number"
                          id="childCount"
                          name="childCount"
                          autoComplete="off"
                          min={0}
                          className="w-16 text-center"
                          value={formData.childCount}
                          onChange={e => {
                            const value = Math.max(0, parseInt(e.target.value) || 0);
                            handleInputChange('childCount', value);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Teléfono de contacto
                    </Label>
                    <label htmlFor="phone" className="text-sm font-medium sr-only">
                      Teléfono de contacto
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      autoComplete="tel"
                      placeholder="Teléfono de contacto"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      type="tel"
                      pattern="[0-9\s\-\(\)\+]+"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comments">
                      <MessageSquare className="inline h-4 w-4 mr-1" />
                      Comentarios especiales
                    </Label>
                    <label htmlFor="comments" className="text-sm font-medium sr-only">
                      Comentarios especiales
                    </label>
                    <Textarea
                      id="comments"
                      name="comments"
                      autoComplete="off"
                      placeholder="Contanos si hay algo especial que necesitás para la fiesta..."
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mensaje de error si la zona no es válida */}
              {/* No hay lógica de zona, solo se muestra la dirección */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando reserva...' : 'Confirmar Reserva'}
              </Button>
            </form>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de la Reserva</CardTitle>
                  <CardDescription>
                    Revisa los productos y precios antes de confirmar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.product?.name}</h4>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                          <span>Cant: {item.quantity}</span>
                          {item.extra_hours > 0 && (
                            <span>• +{item.extra_hours}h extra</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-primary mt-1">
                          {formatPrice(calculateItemTotal(item))}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal productos:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Costo traslado y montaje:</span>
                      <span>{formatPrice(transportCost)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>


                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Información de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      El pago se realiza mediante transferencia bancaria en pesos argentinos después de confirmar la reserva.
                    </p>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Datos bancarios:</h4>
                      <div className="space-y-1 text-blue-800">
                        <p>Banco: Banco de la Nación Argentina</p>
                        <p>CBU: 0110590520000000123456</p>
                        <p>Alias: COOLBALU.EVENTOS</p>
                        <p>Titular: Coolbalu Entretenimientos</p>
                        <p>Moneda: Pesos Argentinos (ARS)</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      * Una vez confirmada la reserva, te enviaremos las instrucciones de pago.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      
    </div>
  );
}
