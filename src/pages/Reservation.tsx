import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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
import { useValidateAddress } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Clock, MapPin, Users, MessageSquare, CreditCard, AlertCircle, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Reservation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: cartItems = [] } = useCartItems();
  const clearCart = useClearCart();
  const validateAddress = useValidateAddress();

  const [formData, setFormData] = useState({
    eventDate: null as Date | null,
    eventTime: '',
    street: '',
    number: '',
    city: 'Rosario',
    adultCount: 1,
    childCount: 0,
    comments: ''
  });

  const [validatedZone, setValidatedZone] = useState<any>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = calculateCartSubtotal(cartItems);
  const transportCost = validatedZone?.transport_cost || 0;
  const total = subtotal + transportCost;

  const handleInputChange = (field: string, value: string | number | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset zone validation if address fields change
    if (field === 'street' || field === 'number' || field === 'city') {
      setValidatedZone(null);
    }
  };

  const handleValidateAddress = async () => {
    if (!formData.street.trim() || !formData.number.trim()) {
      toast({
        title: "Dirección requerida",
        description: "Ingresa la calle y altura del evento",
        variant: "destructive",
      });
      return;
    }

    const fullAddress = `${formData.street} ${formData.number}, ${formData.city}`;

    setIsValidatingAddress(true);
    try {
      const zone = await validateAddress.mutateAsync(fullAddress);
      if (zone) {
        setValidatedZone(zone);
        toast({
          title: "Dirección válida",
          description: `Tu evento está en ${zone.name}. Costo de traslado e instalación: ${formatPrice(zone.transport_cost)}`,
        });
      } else {
        setValidatedZone(null);
        toast({
          title: "Área no cubierta",
          description: "Lo sentimos, no brindamos servicios en esa zona. Solo cubrimos Rosario y alrededores.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error de validación",
        description: "No se pudo validar la dirección. Asegúrate de incluir el barrio o código postal de Rosario.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatedZone) {
      toast({
        title: "Valida la dirección",
        description: "Debes validar la dirección antes de continuar",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    try {
      const fullAddress = `${formData.street} ${formData.number}, ${formData.city}`;
      
      // Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          event_date: formData.eventDate?.toISOString().split('T')[0] || '',
          event_time: formData.eventTime,
          event_address: fullAddress,
          zone_id: validatedZone.id,
          adult_count: formData.adultCount,
          child_count: formData.childCount,
          comments: formData.comments,
          subtotal,
          transport_cost: transportCost,
          total,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Create reservation items
      const reservationItems = cartItems.map(item => ({
        reservation_id: reservation.id,
        product_id: item.product_id,
        product_name: item.product?.name || '',
        product_price: item.product?.base_price || 0,
        quantity: item.quantity,
        extra_hours: item.extra_hours,
        extra_hour_percentage: item.product?.extra_hour_percentage || 0,
        item_total: calculateItemTotal(item)
      }));

      const { error: itemsError } = await supabase
        .from('reservation_items')
        .insert(reservationItems);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
                      <Label>
                        <CalendarDays className="inline h-4 w-4 mr-1" />
                        Fecha del evento
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal min-h-[40px]",
                              !formData.eventDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {formData.eventDate ? (
                                format(formData.eventDate, "PPP", { locale: es })
                              ) : (
                                "Selecciona una fecha"
                              )}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.eventDate || undefined}
                            onSelect={(date) => handleInputChange('eventDate', date || null)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="eventTime">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Hora del evento
                      </Label>
                      <div className="relative">
                        <Input
                          id="eventTime"
                          type="time"
                          value={formData.eventTime}
                          onChange={(e) => handleInputChange('eventTime', e.target.value)}
                          required
                          className="appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventAddress">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Dirección de la fiesta
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <div>
                        <Input
                          id="street"
                          placeholder="Calle (ej: San Martín)"
                          value={formData.street}
                          onChange={(e) => handleInputChange('street', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          id="number"
                          placeholder="Altura (ej: 1234)"
                          value={formData.number}
                          onChange={(e) => handleInputChange('number', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          id="city"
                          placeholder="Ciudad"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidateAddress}
                        disabled={isValidatingAddress || !formData.street.trim() || !formData.number.trim()}
                        className="flex-1"
                      >
                        {isValidatingAddress ? 'Validando...' : 'Validar Dirección'}
                      </Button>
                    </div>
                    
                    {validatedZone && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <div className="h-2 w-2 bg-green-600 rounded-full" />
                        Zona válida: {validatedZone.name} - Traslado e Instalación: {formatPrice(validatedZone.transport_cost)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adultCount">
                        <Users className="inline h-4 w-4 mr-1" />
                        Cantidad de niños
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('adultCount', Math.max(1, formData.adultCount - 1))}
                          disabled={formData.adultCount <= 1}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-medium">{formData.adultCount}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('adultCount', formData.adultCount + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="childCount">
                        <Users className="inline h-4 w-4 mr-1" />
                        Cantidad de adultos
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('childCount', Math.max(0, formData.childCount - 1))}
                          disabled={formData.childCount <= 0}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-medium">{formData.childCount}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('childCount', formData.childCount + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comments">
                      <MessageSquare className="inline h-4 w-4 mr-1" />
                      Comentarios especiales
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder="Contanos si hay algo especial que necesitás para la fiesta..."
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !validatedZone}
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
                      <span>Traslado e Instalación:</span>
                      <span>
                        {validatedZone ? formatPrice(transportCost) : (
                          <span className="text-muted-foreground">Validar dirección</span>
                        )}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {!validatedZone && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Valida tu dirección</p>
                        <p>Necesitamos validar que brindamos servicios en tu zona de Rosario y alrededores.</p>
                      </div>
                    </div>
                  )}
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
      
      <Footer />
    </div>
  );
}