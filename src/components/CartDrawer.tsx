import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartContext } from '@/contexts/CartContext';
import { useCartItems, useUpdateCartItem, useRemoveFromCart, calculateItemTotal, calculateCartTotal, calculateCartSubtotal } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { Minus, Plus, Trash2, ShoppingBag, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CartDrawer = () => {
  const { isCartOpen, closeCart } = useCartContext();
  const { user } = useAuth();
  const { data: cartItems = [], isLoading } = useCartItems();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem.mutate({ itemId, quantity });
  };

  const handleExtraHoursChange = (itemId: string, extraHours: number) => {
    if (extraHours < 0) return;
    updateCartItem.mutate({ itemId, extraHours });
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart.mutate(itemId);
  };

  const handleCheckout = () => {
    closeCart();
    navigate('/reservation');
  };

  const total = calculateCartSubtotal(cartItems);

  if (!user) {
    return (
      <Sheet open={isCartOpen} onOpenChange={closeCart}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Carrito de Compras</SheetTitle>
            <SheetDescription>
              Inicia sesión para agregar productos al carrito
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-64">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Necesitas iniciar sesión para usar el carrito
            </p>
            <Button onClick={() => navigate('/auth')}>
              Iniciar Sesión
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Carrito de Compras
            {cartItems.length > 0 && (
              <Badge variant="secondary">{cartItems.length}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Revisa tus productos antes de reservar
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                Tu carrito está vacío
              </p>
              <div className="space-y-2">
                <Button onClick={() => { closeCart(); navigate('/catalog'); }} className="w-full">
                  Ver Catálogo
                </Button>
                <Button variant="outline" onClick={() => { closeCart(); navigate('/'); }} className="w-full">
                  Ir al Inicio
                </Button>
              </div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{item.product?.name}</h4>
                    {item.product?.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.product.category.name}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(item.product?.base_price || 0)} c/u
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quantity Control */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cantidad:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Extra Hours Control */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Horas extra (+{item.product?.extra_hour_percentage || 0}%):
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtraHoursChange(item.id, item.extra_hours - 1)}
                      disabled={item.extra_hours <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.extra_hours}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtraHoursChange(item.id, item.extra_hours + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="font-bold text-primary">
                    {formatPrice(calculateItemTotal(item))}
                  </span>
                </div>
              </div>
            ))
          )}


        </div>

        {cartItems.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
            
            <Button 
              onClick={handleCheckout}
              className="w-full"
              size="lg"
            >
              Continuar con la Reserva
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
