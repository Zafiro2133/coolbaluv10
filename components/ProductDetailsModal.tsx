import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Star, Clock, Users, Truck, Shield, Plus, Minus } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';


interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailsModal = ({ product, isOpen, onClose }: ProductDetailsModalProps) => {
  const { user } = useAuth();
  const { openCart } = useCartContext();
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotal = () => {
    return product.base_price * quantity;
  };

  const calculateSubtotal = () => {
    return product.base_price * quantity;
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
      await addToCart.mutateAsync({ 
        productId: product.id, 
        quantity
      });
      toast({
        title: "Producto agregado",
        description: `${product.name} se agregó al carrito`,
      });
      openCart();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      });
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Producto Sanitizado",
      description: "Limpio y desinfectado antes de cada uso"
    },
    {
      icon: Truck,
      title: "Incluye Traslado",
      description: "Traslado e instalación en Rosario y alrededores con costo adicional"
    },
    {
      icon: Clock,
      title: "Duración Estándar",
      description: "3 horas de uso incluidas"
    },
    {
      icon: Users,
      title: "Para Toda la Familia",
      description: "Apto para todas las edades"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only"> </DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
          <DialogDescription>
            {product.category?.name && (
              <Badge variant="outline" className="mr-2">
                {product.category.name}
              </Badge>
            )}
            Información detallada del producto
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="w-full h-64 lg:h-80 bg-muted rounded-lg overflow-hidden relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <Card key={index} className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 
                  `${product.name} es perfecto para hacer de tu evento algo especial en Rosario y alrededores. Incluye todo lo necesario para que disfrutes sin preocupaciones. Nuestro equipo se encarga de la instalación y el retiro.`
                }
              </p>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Precio</h3>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(product.base_price)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Precio base por 3 horas de evento. Puedes agregar más horas a tu fiesta una vez continúes al formulario de reserva.
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Cantidad:</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-medium w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({quantity} unidad{quantity > 1 ? 'es' : ''}):</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleAddToCart} 
                  className="w-full" 
                  size="lg"
                  disabled={addToCart.isPending}
                >
                  {addToCart.isPending ? "Agregando..." : "Agregar al Carrito"}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => { onClose(); openCart(); }}
                    className="w-full"
                  >
                    Ver Carrito
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="w-full"
                  >
                    Seguir Comprando
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">¡Servicio Premium!</h4>
                    <p className="text-xs text-muted-foreground">
                      Incluimos instalación y traslado en Rosario y alrededores.
                      *El costo final se calculará según tu zona al hacer la reserva.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
