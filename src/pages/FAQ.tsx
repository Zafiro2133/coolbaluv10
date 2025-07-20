import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  ShoppingCart, 
  MapPin, 
  Clock, 
  Shield, 
  Truck, 
  Star,
  HelpCircle,
  MessageCircle,
  Calendar,
  CreditCard,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FAQ = () => {
  const navigate = useNavigate();

  const faqData = [
    {
      category: "Proceso de Reserva",
      questions: [
        {
          question: "¿Cómo funciona el proceso de reserva?",
          answer: "Nuestro proceso es simple: 1) Explorá el catálogo y agregá productos al carrito, 2) Validá tu dirección para calcular el traslado, 3) Completá los datos del evento y confirmá la reserva, 4) Recibí las instrucciones de pago y disfrutá tu evento."
        },
        {
          question: "¿Puedo modificar mi reserva después de confirmarla?",
          answer: "Sí, podés modificar tu reserva hasta 24 horas antes del evento. Contactanos por WhatsApp o email para hacer los cambios necesarios."
        },
        {
          question: "¿Qué información necesito para hacer una reserva?",
          answer: "Necesitás: dirección exacta del evento, fecha y horario, cantidad de adultos y niños, y tus datos de contacto. El sistema te guía paso a paso."
        }
      ]
    },
    {
      category: "Inflables y Carrito",
      questions: [
        {
          question: "¿Cómo funciona el carrito de compras?",
          answer: "Podés agregar múltiples productos, especificar cantidades y horas extra. El carrito calcula automáticamente los precios y te permite revisar todo antes de confirmar."
        },
        {
          question: "¿Qué son las horas extra y cómo se calculan?",
          answer: "Cada inflable incluye 3 horas de uso. Las horas extra se cobran con un porcentaje adicional sobre el precio base. El sistema calcula automáticamente el costo."
        },
        {
          question: "¿Puedo guardar productos para más tarde?",
          answer: "Sí, el carrito guarda tus productos mientras navegás. Solo necesitás iniciar sesión para mantener tu carrito entre sesiones."
        }
      ]
    },
    {
      category: "Zonas y Traslado",
      questions: [
        {
          question: "¿En qué zonas brindan servicio?",
          answer: "Trabajamos en Rosario y alrededores. El sistema valida automáticamente la dirección de la fiesta y te muestra si está en nuestra zona de cobertura."
        },
        {
          question: "¿Cómo se calcula el costo de traslado?",
          answer: "El costo se calcula automáticamente según la zona de la fiesta. Incluye traslado e instalación. Te mostramos el precio antes de confirmar la reserva."
        },
        {
          question: "¿Qué incluye el servicio de traslado?",
          answer: "Incluye: traslado de inflables, instalación profesional, supervisión, retiro y limpieza. Todo está incluido en el precio."
        }
      ]
    },
    {
      category: "Pagos y Confirmación",
      questions: [
        {
          question: "¿Qué métodos de pago aceptan?",
          answer: "Aceptamos transferencias bancarias y efectivo. Te enviamos las instrucciones de pago por email después de confirmar la reserva."
        },
        {
          question: "¿Cuándo debo pagar?",
          answer: "El pago se realiza después de confirmar la reserva. Te damos las instrucciones por email y necesitamos el comprobante para proceder."
        },
        {
          question: "¿Qué pasa si no puedo pagar a tiempo?",
          answer: "Contactanos inmediatamente si tenés problemas con el pago. Podemos reprogramar la fiesta según disponibilidad."
        }
      ]
    },
    {
      category: "Servicio y Entrega",
      questions: [
        {
          question: "¿A qué hora llegan a instalar?",
          answer: "Llegamos 1 hora antes del horario de la fiesta para instalar todo. Te contactamos el día anterior para confirmar horarios."
        },
        {
          question: "¿Qué pasa si llueve el día de la fiesta?",
          answer: "Si hay mal tiempo, podés reprogramar sin costo hasta 24 horas antes. Nos adaptamos a las condiciones climáticas."
        },
        {
          question: "¿Necesito estar presente durante la instalación?",
          answer: "No es necesario, pero es recomendable para coordinar detalles. Podés dejarnos instrucciones si no vas a estar."
        }
      ]
    },
    {
      category: "Calidad y Seguridad",
      questions: [
        {
          question: "¿Los inflables están sanitizados?",
          answer: "Sí, todos nuestros inflables se sanitizan antes de cada uso. Seguimos protocolos estrictos de limpieza y desinfección."
        },
        {
          question: "¿Qué medidas de seguridad tienen?",
          answer: "Todos nuestros inflables cumplen normas de seguridad."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
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
              Preguntas Frecuentes
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Encontrá respuestas a las preguntas más comunes sobre nuestro servicio de inflables para fiestas infantiles
            </p>
          </div>

          {/* Proceso Detallado */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Proceso Detallado de Reserva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Selección de Inflables
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Explorá nuestro catálogo de inflables organizado por categorías</li>
                        <li>• Agregá inflables al carrito con cantidad y horas extra</li>
                        <li>• Revisá el carrito y ajustá según necesites</li>
                        <li>• Podés guardar inflables para más tarde</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Validación de Dirección
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Ingresá la dirección de la fiesta</li>
                        <li>• El sistema detecta automáticamente la zona</li>
                        <li>• Te muestra el costo de traslado e instalación</li>
                        <li>• Validá que esté en nuestra zona de cobertura</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Completar Reserva
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Elegí fecha y horario de la fiesta</li>
                        <li>• Especificá cantidad de niños</li>
                        <li>• Agregá comentarios especiales si necesitás</li>
                        <li>• Revisá el resumen final antes de confirmar</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Confirmación y Pago
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Recibí las instrucciones de pago por email</li>
                        <li>• Confirmá tu reserva enviando el comprobante</li>
                        <li>• Te contactamos para coordinar la entrega</li>
                        <li>• ¡Listo para que los chicos disfruten!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Accordion */}
          <div className="space-y-8">
            {faqData.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, itemIndex) => (
                      <AccordionItem key={itemIndex} value={`item-${categoryIndex}-${itemIndex}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact CTA */}
          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-semibold mb-4">¿No encontraste tu respuesta?</h3>
              <p className="text-muted-foreground mb-6">
                Nuestro equipo está acá para ayudarte. Contactanos y te responderemos a la brevedad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="coolbalu" 
                  size="lg"
                  onClick={() => navigate('/contact')}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contactanos
                </Button>
                <Button 
                  variant="coolbalu_outline" 
                  size="lg"
                  onClick={() => window.open('https://wa.me/5493412770608', '_blank')}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQ; 