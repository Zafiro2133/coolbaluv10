import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Index from './pages/Index';
import { Catalog } from './pages/Catalog';
import Reservation from './pages/Reservation';
import Profile from './pages/Profile';
import FAQ from './pages/FAQ';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth';
import { Contact } from './pages/Contact';
import NotFound from './pages/NotFound';

const App = () => (
  <Routes>
    <Route path="/" element={<Layout><Index /></Layout>} />
    <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
    <Route path="/reservation" element={<Layout><Reservation /></Layout>} />
    <Route path="/profile" element={<Layout><Profile /></Layout>} />
    <Route path="/faq" element={<Layout><FAQ /></Layout>} />
    <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
    <Route path="/auth" element={<Layout><Auth /></Layout>} />
    <Route path="/contact" element={<Layout><Contact /></Layout>} />
    <Route path="*" element={<Layout><NotFound /></Layout>} />
  </Routes>
);

export default App; 