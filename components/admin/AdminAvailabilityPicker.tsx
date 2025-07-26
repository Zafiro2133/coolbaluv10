import React, { useState, useEffect } from 'react';
import { Calendar } from '../ui/calendar';
import { supabase } from '@/services/supabase/client';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import type { DateRange } from 'react-day-picker';

interface Availability {
  id: string;
  date: string;
  hour: string;
}

const horas = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

function getDatesInRange(start: Date, end: Date): string[] {
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
    const year = current.getFullYear();
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    const day = current.getDate().toString().padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function AdminAvailabilityPicker() {
  const [rango, setRango] = useState<DateRange | undefined>(undefined);
  const [horasSeleccionadas, setHorasSeleccionadas] = useState<string[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [horaInput, setHoraInput] = useState('12:00');

  // Cargar disponibilidades existentes
  useEffect(() => {
    const fetchDisponibilidades = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('availabilities')
        .select('*')
        .order('date', { ascending: true })
        .order('hour', { ascending: true });
      if (!error && data) setDisponibilidades(data);
      setLoading(false);
    };
    fetchDisponibilidades();
  }, []);

  // Agregar nuevas disponibilidades por rango y horas
  const agregarDisponibilidades = async () => {
    if (!rango?.from || horasSeleccionadas.length === 0) return;
    const start = rango.from;
    const end = rango.to ?? rango.from;
    const fechas = getDatesInRange(start, end);
    console.log('Fechas generadas:', fechas);
    console.log('Horas seleccionadas:', horasSeleccionadas);
    // Evitar duplicados
    const nuevas: { date: string; hour: string }[] = [];
    for (const date of fechas) {
      for (const hour of horasSeleccionadas) {
        // Asegurar que la hora tenga el formato correcto para PostgreSQL TIME
        const formattedHour = hour.includes(':') ? hour : hour + ':00';
        if (!disponibilidades.some(d => d.date === date && d.hour === formattedHour)) {
          nuevas.push({ date, hour: formattedHour });
        }
      }
    }
    console.log('Nuevas disponibilidades a insertar:', nuevas);
    if (nuevas.length === 0) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('availabilities')
      .insert(nuevas)
      .select();
    if (!error && data) {
      console.log('Disponibilidades insertadas:', data);
      setDisponibilidades(prev => [...prev, ...data]);
    } else {
      console.error('Error al insertar disponibilidades:', error);
    }
    setLoading(false);
  };

  // Eliminar disponibilidad
  const eliminarDisponibilidad = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('availabilities')
      .delete()
      .eq('id', id);
    if (!error) setDisponibilidades(prev => prev.filter(d => d.id !== id));
    setLoading(false);
  };

  // Manejar selección de horas
  const toggleHora = (hora: string) => {
    setHorasSeleccionadas(prev =>
      prev.includes(hora)
        ? prev.filter(h => h !== hora)
        : [...prev, hora]
    );
  };

  const agregarHoraPersonalizada = () => {
    if (horaInput && !horasSeleccionadas.includes(horaInput)) {
      setHorasSeleccionadas(prev => [...prev, horaInput]);
    }
  };
  const eliminarHoraSeleccionada = (hora: string) => {
    setHorasSeleccionadas(prev => prev.filter(h => h !== hora));
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Configurar fechas y horarios disponibles</h2>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <Label htmlFor="calendar-range" className="block mb-2 font-medium">
            Seleccionar rango de fechas:
          </Label>
          <Calendar
            id="calendar-range"
            mode="range"
            selected={rango}
            onSelect={setRango}
            className="rounded-md border"
          />
        </div>
        <div>
          <Label htmlFor="horaInput" className="block mb-2 font-medium">
            Agregar hora personalizada:
          </Label>
          <div className="flex gap-2 mb-2">
            <Input
              type="time"
              id="horaInput"
              name="horaInput"
              value={horaInput}
              onChange={e => setHoraInput(e.target.value)}
              className="border rounded px-2 py-1"
              step="900"
            />
            <Button 
              type="button" 
              onClick={agregarHoraPersonalizada} 
              disabled={!horaInput || horasSeleccionadas.includes(horaInput)}
            >
              Agregar hora
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {horasSeleccionadas.map(h => (
              <span key={h} className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {h}
                <button
                  type="button"
                  className="ml-1 text-red-500 hover:text-red-700"
                  onClick={() => eliminarHoraSeleccionada(h)}
                  aria-label={`Eliminar hora ${h}`}
                >
                  ×
                </button>
              </span>
            ))}
            {horasSeleccionadas.length === 0 && <span className="text-gray-400">No hay horas seleccionadas</span>}
          </div>
        </div>
        <Button onClick={agregarDisponibilidades} disabled={!rango?.from || horasSeleccionadas.length === 0 || loading}>
          Agregar disponibilidades
        </Button>
      </div>
      
      <h3 className="font-semibold mb-2">Disponibilidades guardadas:</h3>
      {disponibilidades.length > 0 && (
        <Button
          variant="destructive"
          className="mb-2"
          onClick={async () => {
            setLoading(true);
            const ids = disponibilidades.map(d => d.id);
            if (ids.length === 0) {
              setLoading(false);
              return;
            }
            const { error } = await supabase
              .from('availabilities')
              .delete()
              .in('id', ids);
            if (!error) setDisponibilidades([]);
            setLoading(false);
          }}
        >
          Eliminar todas las disponibilidades
        </Button>
      )}
      {loading && <p>Cargando...</p>}
      <ul className="space-y-2">
        {disponibilidades.map(d => (
          <li key={d.id} className="flex items-center justify-between border-b py-1">
            <span>{d.date} - {d.hour}</span>
            <Button variant="destructive" size="sm" onClick={() => eliminarDisponibilidad(d.id)}>
              Eliminar
            </Button>
          </li>
        ))}
        {disponibilidades.length === 0 && !loading && <li>No hay disponibilidades configuradas.</li>}
      </ul>
    </div>
  );
} 