import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image } from "lucide-react";
import { Product } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  onDetails: () => void;
  onReserve: () => void;
}

export const ProductCard = ({ product, onDetails, onReserve }: ProductCardProps) => {
  const { user } = useAuth();
  const { openCart } = useCartContext();
  const addToCart = useAddToCart();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para agregar productos al carrito",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart.mutateAsync({ productId: product.id });
      toast({
        title: "Producto agregado",
        description: `${product.name} se agregó al carrito`,
      });
      openCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full rounded-2xl shadow-md overflow-hidden bg-card">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="w-full h-48 bg-muted flex items-center justify-center border-b border-border relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image className="h-12 w-12 text-muted-foreground" />
          )}
          {product.extra_hour_percentage > 0 && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
              +${Math.round(product.base_price * (product.extra_hour_percentage / 100)).toLocaleString()}/hora extra
            </Badge>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
            {product.category && (
              <Badge variant="outline" className="text-xs ml-2">
                {product.category.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2">
            {product.description || 'Sin descripción disponible'}
          </p>
          
          <div className="text-2xl font-bold text-primary mb-6">
            {formatPrice(product.base_price)}
            <span className="text-sm text-muted-foreground font-normal ml-2">
              por 3 horas
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              variant="link" 
              className="text-coolbalu-orange font-semibold p-0 h-auto underline-offset-4"
              onClick={onDetails}
            >
              Detalles
            </Button>
            <Button 
              variant="coolbalu" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
            >
              {addToCart.isPending ? 'Agregando...' : 'Agregar al Carrito'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};