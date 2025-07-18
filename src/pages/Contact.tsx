import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Phone, Mail, MapPin, Clock } from "lucide-react";

export const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Contactanos
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ¿Tenés alguna pregunta? Estamos acá para ayudarte. Contactanos y te responderemos a la brevedad.
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
                  Completá el formulario y nos pondremos en contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nombre</label>
                      <Input placeholder="Tu nombre" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Apellido</label>
                      <Input placeholder="Tu apellido" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input type="email" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Teléfono</label>
                    <Input placeholder="Tu teléfono" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mensaje</label>
                    <Textarea 
                      placeholder="Contanos sobre tu evento..."
                      className="min-h-32"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Enviar Mensaje
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
                      <p className="text-muted-foreground">+54 9 11 1234-5678</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">hola@coolbalu.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-muted-foreground">Buenos Aires, Argentina</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Horarios</p>
                      <p className="text-muted-foreground">Lun - Vie: 9:00 - 18:00</p>
                      <p className="text-muted-foreground">Sáb: 9:00 - 15:00</p>
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
                    <li>• Amplia experiencia en eventos</li>
                    <li>• Cobertura en CABA y GBA</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};