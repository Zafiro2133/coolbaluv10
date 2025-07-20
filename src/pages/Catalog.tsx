import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { useProducts } from '@/hooks/useProducts';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Catalog = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { data: products = [] } = useProducts(activeCategory);
  const navigate = useNavigate();

  // Hacer scroll hacia arriba cuando se carga la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedProduct = selectedProductId 
    ? products.find(p => p.id === selectedProductId) || null 
    : null;

  const handleProductDetails = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleProductReserve = (productId: string) => {
    navigate('/reservation');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8">
        <div className="max-w-6xl mx-auto px-6">
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
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Nuestros<br />Inflables
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Descubrí nuestra amplia gama de inflables para hacer de la fiesta de tus chicos algo especial.
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

          <ProductDetailsModal
            product={selectedProduct}
            isOpen={selectedProductId !== null}
            onClose={() => setSelectedProductId(null)}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};