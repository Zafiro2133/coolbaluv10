import React from 'react';
import AdminAvailabilityPicker from '@/components/admin/AdminAvailabilityPicker';

export default function AdminAvailabilities() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Fechas y Horarios Disponibles</h1>
      <AdminAvailabilityPicker />
    </div>
  );
} 