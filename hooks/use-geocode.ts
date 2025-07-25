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

// Utilidad para detectar la zona y el costo de traslado dado lat/lon y lista de zonas
export function detectZoneAndTransportCost(coords: { lat: number; lon: number } | null, zones: any[]): { zone: any | null, transportCost: number } {
  if (!coords || !zones || zones.length === 0) return { zone: null, transportCost: 0 };
  try {
    // Usar turf para comparar punto con polígonos
    // (asumimos que booleanPointInPolygon y point están disponibles globalmente o importar aquí si hace falta)
    // Si no, el consumidor debe importar turf
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const point = require('@turf/helpers').point;
    const pt = point([coords.lon, coords.lat]);
    const matchingZones = [];
    for (const zone of zones) {
      if (zone.coordinates) {
        let coordinates = zone.coordinates;
        if (typeof coordinates === 'string') {
          try { coordinates = JSON.parse(coordinates); } catch { continue; }
        }
        let feature: any;
        if (coordinates.type === 'Polygon' || coordinates.type === 'MultiPolygon') {
          feature = { type: 'Feature', geometry: coordinates, properties: {} };
        } else if (Array.isArray(coordinates)) {
          feature = { type: 'Feature', geometry: { type: 'Polygon', coordinates }, properties: {} };
        } else {
          continue;
        }
        if (booleanPointInPolygon(pt, feature)) {
          matchingZones.push(zone);
        }
      }
    }
    const activeZone = matchingZones.find((z: any) => z.is_active);
    if (activeZone) {
      return { zone: activeZone, transportCost: Number(activeZone.transport_cost) || 0 };
    } else if (matchingZones.length > 0) {
      return { zone: matchingZones[0], transportCost: Number(matchingZones[0].transport_cost) || 0 };
    }
    return { zone: null, transportCost: 0 };
  } catch {
    return { zone: null, transportCost: 0 };
  }
} 