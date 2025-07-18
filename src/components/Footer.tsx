import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Facebook, 
  Instagram, 
  MessageCircle,
  ArrowUp
} from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Coolbalu</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Hacemos de tu evento algo especial con la mejor calidad en alquiler de juegos inflables, mobiliario y servicios de catering.
            </p>
            
            {/* Social Media */}
            <div className="flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=100076060550859" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  <Facebook className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://www.instagram.com/coolbalu.entretenimientos/" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://wa.me/543412770608" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">
                    Rosario y Alrededores,<br />
                    Santa Fe, Argentina
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">+54 341 2770608</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">contactocoolbalu@gmail.com</span>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-muted-foreground">
                  <p>Lun - Vie: 9:00 - 18:00</p>
                  <p>Sáb: 9:00 - 21:00</p>
                  <p>Dom: 9:00 - 21:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Enlaces Rápidos</h4>
            <div className="space-y-2 text-sm">
              <Link 
                to="/" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Inicio
              </Link>
              <Link 
                to="/catalog" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Catálogo
              </Link>
              <Link 
                to="/reservation" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Hacer Reserva
              </Link>
              <Link 
                to="/profile" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Mi Perfil
              </Link>
              <a 
                href="#como-funciona" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Cómo Funciona
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Nuestros Servicios</h4>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Juegos Inflables</p>
              <p className="text-muted-foreground">Mobiliario para Eventos</p>
              <p className="text-muted-foreground">Servicios de Catering</p>
              <p className="text-muted-foreground">Traslado y Montaje Incluidos</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Footer */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} Coolbalu. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <button className="hover:text-primary transition-colors">
                Términos y Condiciones
              </button>
              <button className="hover:text-primary transition-colors">
                Política de Privacidad
              </button>
            </div>
          </div>
          
          {/* Scroll to Top Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:text-primary"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="hidden sm:inline">Volver arriba</span>
          </Button>
        </div>
      </div>

      {/* WhatsApp Float Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-green-500 hover:bg-green-600 text-white"
          onClick={() => window.open('https://wa.me/5491123456789', '_blank')}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">WhatsApp</span>
        </Button>
      </div>
    </footer>
  );
};