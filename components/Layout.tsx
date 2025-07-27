import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <CartDrawer />
    <main>{children}</main>
    <Footer />
  </>
); 