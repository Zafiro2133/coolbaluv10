import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Phone, Mail, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useContact } from "@/hooks/useContact";

export const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendMessage } = useContact();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    mensaje: ''
  };
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    mensaje: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "Por favor completá tu nombre",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.apellido.trim()) {
      toast({
        title: "Error",
        description: "Por favor completá tu apellido",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Error",
        description: "Por favor ingresá un email válido",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.telefono.trim()) {
      toast({
        title: "Error",
        description: "Por favor completá tu teléfono",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.mensaje.trim()) {
      toast({
        title: "Error",
        description: "Por favor escribí tu mensaje",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Enviar mensaje a Supabase
      await sendMessage.mutateAsync({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        mensaje: formData.mensaje
      });
      
      toast({
        title: "¡Mensaje enviado!",
        description: "Gracias por contactarnos. Te responderemos a la brevedad.",
      });

      // Limpiar formulario
      setFormData(initialFormData);

    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el mensaje. Por favor intentá nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Contactanos
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tenés alguna pregunta sobre nuestros servicios para fiestas infantiles? Estamos acá para ayudarte. Contactanos y te responderemos a la brevedad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Envianos un Mensaje
                </CardTitle>
                <CardDescription>
                  Completá el formulario y nos pondremos en contacto para ayudarte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nombre</label>
                      <Input 
                        placeholder="Tu nombre" 
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Apellido</label>
                      <Input 
                        placeholder="Tu apellido" 
                        value={formData.apellido}
                        onChange={(e) => handleInputChange('apellido', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Teléfono</label>
                    <Input 
                      placeholder="Tu teléfono" 
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mensaje</label>
                    <Textarea 
                      placeholder="Contanos sobre tu evento..."
                      className="min-h-32"
                      value={formData.mensaje}
                      onChange={(e) => handleInputChange('mensaje', e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-muted-foreground">+54 341 2770608</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">contactocoolbalu@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-muted-foreground">Rosario y Alrededores,<br />Santa Fe, Argentina</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Horarios</p>
                      <p className="text-muted-foreground">Lun - Vie: 9:00 - 18:00</p>
                      <p className="text-muted-foreground">Sáb: 9:00 - 21:00</p>
                      <p className="text-muted-foreground">Dom: 9:00 - 21:00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>¿Por qué elegirnos?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Respuesta rápida en menos de 24hs</li>
                    <li>• Atención personalizada para tu evento</li>
                    <li>• Presupuestos sin compromiso</li>
                    <li>• Amplia experiencia en fiestas infantiles</li>
                    <li>• Cobertura en Rosario y alrededores</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nuestros Servicios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Juegos Inflables</li>
                    <li>• Mobiliario para Eventos</li>
                    <li>• Servicios de Catering</li>
                    <li>• Traslado y Montaje Incluidos</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
};