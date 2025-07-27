import { HeroSection } from "@/components/HeroSection";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Shield, Truck, Star, ShoppingCart, MessageCircle, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { data: products = [] } = useProducts(activeCategory);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedProduct = selectedProductId 
    ? products.find(p => p.id === selectedProductId) || null 
    : null;

  // Handle anchor scrolling when navigating to page with hash
  useEffect(() => {
    // Solo hacer scroll si el hash es un selector CSS válido (ej: #mi-seccion)
    if (location.hash && /^#[a-zA-Z][\w\-]*$/.test(location.hash)) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  const handleProductDetails = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleProductReserve = (productId: string) => {
    navigate('/reservation');
  };

  return (
    <main>
      {/* Hero Section */}
      <HeroSection />

      {/* How it Works Section */}
      <section id="como-funciona" className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ¿Cómo Funciona?
          </h2>
          <p className="text-muted-foreground mb-12 max-w-3xl mx-auto text-lg">
            Nuestro proceso es simple y transparente. Te guiamos paso a paso para que la fiesta de tus chicos sea perfecta.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Explorá</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Navegá nuestro catálogo organizado por categorías. Agregá inflables, mobiliario y/o catering al carrito con la cantidad que necesites.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Configurá</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Revisá tu carrito y ajustá cantidades. El sistema calcula automáticamente el costo base incluyendo traslado e instalación.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Reservá</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Elegí fecha disponible, horario y duración del evento. Completá dirección, datos de contacto y comentarios especiales.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Confirmá</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Recibí tu reserva con estado "Pendiente Pago". Enviá el comprobante de pago y nosotros confirmamos la instalación.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="coolbalu" 
              size="lg"
              onClick={() => navigate('/catalog')}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Empezar a Comprar
            </Button>
            <Button 
              variant="coolbalu_outline" 
              size="lg"
              onClick={() => navigate('/faq')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Ver Preguntas Frecuentes
            </Button>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            ¿Por Qué Elegirnos?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Proceso Simplificado</h3>
                    <p className="text-muted-foreground">
                      Nuestro sistema online te permite reservar inflables para fiestas infantiles en minutos. Desde la selección hasta la confirmación, todo es transparente y fácil.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Calidad Garantizada</h3>
                    <p className="text-muted-foreground">
                      Todos nuestros inflables están sanitizados y en perfecto estado. Incluimos instalación y retiro para que la fiesta sea perfecta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Cobertura Completa</h3>
                    <p className="text-muted-foreground">
                      Trabajamos en Rosario y alrededores. Servicio completo con traslado e instalación incluidos para que solo te preocupes por disfrutar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Experiencia Premium</h3>
                    <p className="text-muted-foreground">
                    Nuestro equipo profesional se encarga de todo para que vos te relajes y los chicos disfruten al máximo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Nuestros Productos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Lleamos con la diversión
            </p>
          </div>

          <CategoryFilter 
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="mt-8">
            <ProductGrid 
              selectedCategory={activeCategory}
              onProductDetails={handleProductDetails}
              onProductReserve={handleProductReserve}
            />
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="coolbalu" 
              size="lg"
              onClick={() => navigate('/catalog')}
            >
              Ver Catálogo Completo
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ¿Listos para divertirse a lo grande?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Empezá a planificar la celebración perfecta hoy mismo
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="coolbalu" 
              size="lg"
              onClick={() => navigate('/catalog')}
            >
              Explorar
            </Button>
            <Button 
              variant="coolbalu_outline" 
              size="lg"
              onClick={() => navigate('/reservation')}
            >
              Hacer Reserva
            </Button>
          </div>
        </div>
      </section>

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={selectedProductId !== null}
        onClose={() => setSelectedProductId(null)}
      />
    </main>
  );
};

export default Index;
