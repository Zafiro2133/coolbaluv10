import { ProductCard } from "./ProductCard";
import { useProducts } from '@/hooks/useProducts';

interface ProductGridProps {
  selectedCategory: string;
  onProductDetails: (productId: string) => void;
  onProductReserve: (productId: string) => void;
}

const ProductGrid = ({ selectedCategory, onProductDetails, onProductReserve }: ProductGridProps) => {
  const { data: products, isLoading, error } = useProducts(selectedCategory);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Error loading products:', error);
    return (
      <div className="text-center py-12 px-6">
        <p className="text-muted-foreground">Error al cargar los productos</p>
      </div>
    );
  }

  // Asegurar que products sea un array válido
  const validProducts = Array.isArray(products) ? products : [];

  if (!validProducts.length) {
    return (
      <div className="text-center py-12 px-6">
        <p className="text-muted-foreground">
          No hay productos disponibles en esta categoría
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-8">
      {validProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onDetails={() => onProductDetails(product.id)}
          onReserve={() => onProductReserve(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;