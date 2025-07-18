import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { useProducts } from '@/hooks/useProducts';
import { useNavigate } from "react-router-dom";

export const Catalog = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8">
        <div className="text-center px-6 mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Nuestros<br />Productos
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Descubrí nuestra amplia gama de productos y servicios para hacer de tu evento algo especial
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
      </main>
      
      <Footer />
    </div>
  );
};