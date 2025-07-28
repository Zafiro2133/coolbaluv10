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
          answer: "Nuestro proceso es simple: 1) Explorá el catálogo y agregá productos al carrito, 2) Ingresá tu dirección y el sistema validará si está dentro del área de cobertura, 3) Completá los datos del evento incluyendo horas extra en el formulario final, 4) Confirmá la reserva y recibí las instrucciones de pago."
        },
        {
          question: "¿Podés modificar tu reserva después de confirmarla?",
          answer: "Sí, podés modificar tu reserva hasta 24 horas antes del evento. Contactanos por WhatsApp o email para hacer los cambios necesarios."
        },
        {
          question: "¿Qué información necesitás para hacer una reserva?",
          answer: "Necesitás: dirección exacta del evento, fecha y horario, cantidad de adultos y pibes y tus datos de contacto. El sistema te guía paso a paso."
        }
      ]
    },
    {
      category: "Productos y Carrito",
      questions: [
        {
          question: "¿Cómo funciona el carrito de compras?",
          answer: "Podés agregar múltiples productos (inflables, mobiliario, catering) al carrito especificando cantidades. El carrito calcula automáticamente los precios base y te permite revisar todo antes de proceder al formulario de reserva."
        },
        {
          question: "¿Qué son las horas extra y cómo se agregan?",
          answer: "Cada producto ofrece 3 horas de uso. Las horas extra se agregan en el formulario de reserva al final, donde podés especificar cuántas horas adicionales necesitás para cada inflable. El sistema calcula automáticamente el costo adicional."
        },
        {
          question: "¿Podés guardar productos para más tarde?",
          answer: "Sí, el carrito guarda tus productos mientras navegás. Solo necesitás iniciar sesión para mantener tu carrito entre sesiones."
        }
      ]
    },
    {
      category: "Servicio y Traslado",
      questions: [
        {
          question: "¿En qué áreas brindan servicio?",
          answer: "Trabajamos en Rosario y alrededores. Validá tu dirección para saber si estás dentro del área de cobertura. El costo de traslado e instalación es fijo."
        },
        {
          question: "¿Qué incluye el servicio?",
          answer: "Incluye: traslado de productos, instalación profesional, retiro y limpieza. Todo está incluido en el precio base."
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
          question: "¿Cuándo tenés que pagar?",
          answer: "El pago se realiza después de confirmar la reserva. Te damos las instrucciones por email y necesitamos el comprobante para proceder."
        },
        {
          question: "¿Qué pasa si no podés pagar a tiempo?",
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
          question: "¿Necesitás estar presente durante la instalación?",
          answer: "No es necesario, pero es recomendable para coordinar detalles. Podés dejarnos instrucciones si no vas a estar."
        }
      ]
    },
    {
      category: "Calidad y Seguridad",
      questions: [
        {
          question: "¿Los productos están sanitizados?",
          answer: "Sí, todos nuestros productos se sanitizan antes de cada uso. Seguimos protocolos estrictos de limpieza y desinfección."
        },
        {
          question: "¿Qué medidas de seguridad tienen?",
          answer: "Todos nuestros inflables cumplen normas de seguridad y contamos con personal capacitado para supervisar durante el evento."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      
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
              Encontrá respuestas a las preguntas más comunes sobre nuestro servicio de inflables, mobiliario y catering para fiestas infantiles
            </p>
          </div>

          

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
      
    </div>
  );
};

export default FAQ;
