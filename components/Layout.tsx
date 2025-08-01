import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <CartDrawer />
    <EmailVerificationBanner />
    <main>{children}</main>
    <Footer />
  </>
); 