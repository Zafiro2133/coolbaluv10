import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Shield, Truck, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { data: products = [] } = useProducts(activeCategory);
  const navigate = useNavigate();

  const selectedProduct = selectedProductId 
    ? products.find(p => p.id === selectedProductId) || null 
    : null;

  const handleProductDetails = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleProductReserve = (productId: string) => {
    navigate('/reservation');
  };

  const features = [
    {
      icon: Clock,
      title: "Entrega Rápida",
      description: "Entregamos en el día acordado sin demoras"
    },
    {
      icon: Shield,
      title: "Calidad Garantizada",
      description: "Productos sanitizados y en perfecto estado"
    },
    {
      icon: Truck,
      title: "Transporte Incluido",
      description: "Llevamos y retiramos todo por vos"
    },
    {
      icon: Star,
      title: "Experiencia Única",
      description: "Hacemos de tu evento algo inolvidable"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* How it Works Section */}
        <section id="como-funciona" className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
              En solo 3 pasos simples tendrás todo listo para tu evento
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Elegí</h3>
                <p className="text-muted-foreground">
                  Navegá nuestro catálogo y seleccioná los productos que más te gusten
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Reservá</h3>
                <p className="text-muted-foreground">
                  Completá tus datos y elegí la fecha de tu evento
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Disfrutá</h3>
                <p className="text-muted-foreground">
                  Nosotros nos encargamos de todo, vos solo disfrutá tu evento
                </p>
              </div>
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
              {features.map((feature, index) => (
                <Card key={index} className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                Descubrí nuestra amplia gama de productos para hacer de tu evento algo especial
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
              ¿Listo para tu evento?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Empezá a planificar tu celebración perfecta hoy mismo
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="coolbalu" 
                size="lg"
                onClick={() => navigate('/catalog')}
              >
                Explorar Productos
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
      
      <Footer />
    </div>
  );
};

export default Index;
