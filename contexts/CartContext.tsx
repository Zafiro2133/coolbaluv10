import React, { createContext, useContext, useState } from 'react';

interface CartAddress {
  street: string;
  number: string;
  city: string;
}

interface CartContextType {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  address: CartAddress;
  setAddress: (address: CartAddress) => void;
  zone: any | null;
  setZone: (zone: any | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [address, setAddress] = useState<CartAddress>({ street: '', number: '', city: 'Rosario' });
  const [zone, setZone] = useState<any | null>(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  return (
    <CartContext.Provider value={{ isCartOpen, openCart, closeCart, toggleCart, address, setAddress, zone, setZone }}>
      {children}
    </CartContext.Provider>
  );
};