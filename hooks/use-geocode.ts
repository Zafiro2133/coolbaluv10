import { useState } from 'react';

export function useGeocode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const geocode = async (street: string, number: string, city: string = 'Rosario') => {
    setLoading(true);
    setError(null);
    setCoords(null);
    try {
      const query = encodeURIComponent(`${street} ${number}, ${city}, Santa Fe, Argentina`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await res.json();
      if (data && data.length > 0) {
        setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      } else {
        setError('No se encontró la dirección.');
      }
    } catch (e) {
      setError('Error al buscar la dirección.');
    } finally {
      setLoading(false);
    }
  };

  return { geocode, coords, loading, error };
}

 