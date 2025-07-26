import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase/client';

export default function DebugAvailabilities() {
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('availabilities')
          .select('*')
          .order('date', { ascending: true })
          .order('hour', { ascending: true });
        
        if (error) {
          console.error('Error fetching availabilities:', error);
          setError(error.message);
        } else {
          console.log('Availabilities fetched:', data);
          setAvailabilities(data || []);
        }
      } catch (err) {
        console.error('Exception fetching availabilities:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilities();
  }, []);

  const addTestAvailability = async () => {
    try {
      const testData = {
        date: '2025-01-20',
        hour: '14:00:00'
      };
      
      const { data, error } = await supabase
        .from('availabilities')
        .insert(testData)
        .select();
      
      if (error) {
        console.error('Error adding test availability:', error);
        setError(error.message);
      } else {
        console.log('Test availability added:', data);
        // Refresh the list
        const { data: refreshedData } = await supabase
          .from('availabilities')
          .select('*')
          .order('date', { ascending: true })
          .order('hour', { ascending: true });
        setAvailabilities(refreshedData || []);
      }
    } catch (err) {
      console.error('Exception adding test availability:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return <div className="p-4">Cargando disponibilidades...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Debug: Disponibilidades</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      <button
        onClick={addTestAvailability}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Agregar disponibilidad de prueba
      </button>
      
      <div className="space-y-2">
        <h4 className="font-medium">Disponibilidades actuales ({availabilities.length}):</h4>
        {availabilities.length === 0 ? (
          <p className="text-gray-500">No hay disponibilidades configuradas</p>
        ) : (
          <ul className="space-y-1">
            {availabilities.map((availability) => (
              <li key={availability.id} className="text-sm">
                <strong>ID:</strong> {availability.id} | 
                <strong>Fecha:</strong> {availability.date} | 
                <strong>Hora:</strong> {availability.hour} | 
                <strong>Tipo hora:</strong> {typeof availability.hour}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 