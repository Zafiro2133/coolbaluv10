import React, { useState, useEffect, useRef } from "react";
// Importa el componente del mapa (a crear)
import ZoneMap from "./ZoneMap";
import { supabase } from "../../services/supabase/client";
import { useToast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const ZoneManager: React.FC = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [polygonCoords, setPolygonCoords] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar zonas existentes al montar
  useEffect(() => {
    const fetchZones = async () => {
      const { data, error } = await supabase.from("zones").select("*");
      if (error) {
        toast({ title: "Error al cargar zonas", description: error.message, variant: "destructive" });
        return;
      }
      if (data) setZones(data);
    };
    fetchZones();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (dialogOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [dialogOpen]);

  // Cuando se dibuja un polígono en el mapa
  const handlePolygonDrawn = (coords: any) => {
    setPolygonCoords(coords);
    setDialogOpen(true);
    toast({ title: "Polígono dibujado", description: "El polígono se ha dibujado correctamente. Completa los datos para guardar la zona." });
  };

  // Guardar zona en Supabase
  const handleSaveZone = async () => {
    if (!zoneName || !polygonCoords || !transportCost) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("zones").insert({
      name: zoneName,
      transport_cost: parseFloat(transportCost),
      coordinates: polygonCoords,
      is_active: true,
    }).select();
    setLoading(false);
    if (error) {
      toast({ title: "Error al guardar zona", description: error.message, variant: "destructive" });
      return;
    }
    if (data && data[0]) {
      setZones((prev) => [...prev, data[0]]);
      toast({ title: "Zona agregada", description: "La zona fue guardada correctamente." });
      setDialogOpen(false);
      setZoneName("");
      setTransportCost("");
      setPolygonCoords(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Zonas No Cubiertas</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Columna izquierda: Mapa */}
        <div className="md:w-1/2 w-full">
          <ZoneMap onPolygonDrawn={handlePolygonDrawn} polygonCoords={polygonCoords} />
        </div>
        {/* Columna derecha: Formulario y lista */}
        <div className="md:w-1/2 w-full flex flex-col">
          {/* Formulario solo si hay polígono dibujado */}
          {polygonCoords && (
            <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Agregar nueva zona</h2>
              <span className="block mb-2 text-yellow-700 font-semibold">¡Atención! Debes completar todos los campos para guardar la zona. El polígono ya está dibujado y visible en el mapa.</span>
              <div className="space-y-4">
                <Input
                  ref={inputRef}
                  placeholder="Nombre de la zona"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  disabled={loading}
                />
                <Input
                  placeholder="Costo de transporte"
                  type="number"
                  value={transportCost}
                  onChange={e => setTransportCost(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveZone} disabled={loading}>Guardar</Button>
                <Button variant="secondary" type="button" onClick={() => {
                  setPolygonCoords(null);
                  setZoneName("");
                  setTransportCost("");
                }}>Cancelar</Button>
              </div>
            </div>
          )}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Zonas agregadas</h2>
            <div className="flex flex-wrap gap-2">
              {zones.length === 0 && <span className="text-gray-500">No hay zonas agregadas aún.</span>}
              {zones.map((zone) => (
                <Badge key={zone.id}>{zone.name} (${zone.transport_cost})</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneManager; 