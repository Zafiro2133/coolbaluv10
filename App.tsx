import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useFixSelectElements } from './hooks/use-fix-select-elements';

// Importaciones directas de páginas
import Index from './pages/Index';
import { Catalog } from './pages/Catalog';
import { Contact } from './pages/Contact';
import Auth from './pages/Auth';
import EmailConfirmation from './pages/EmailConfirmation';
import { ActivateAccount } from './pages/ActivateAccount';
import Reservation from './pages/Reservation';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import AdminAvailabilities from './pages/AdminAvailabilities';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import DebugPage from './pages/Debug';
import TerminosYCondiciones from './pages/TerminosYCondiciones';

const App = () => {
  useFixSelectElements();
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/confirm-email" element={<EmailConfirmation />} />
        <Route path="/activate" element={<ActivateAccount />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/availabilities" element={<AdminAvailabilities />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/TerminosYCondiciones" element={<TerminosYCondiciones />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default App; 