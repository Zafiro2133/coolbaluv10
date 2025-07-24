import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from "@/components/ui/toaster";
import { CartDrawer } from '@/components/CartDrawer';

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <CartDrawer />
    <main>{children}</main>
    <Footer />
    <Toaster />
  </>
); 