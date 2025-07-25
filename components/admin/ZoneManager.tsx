import React, { useState, useEffect, useRef } from "react";
// Importa el componente del mapa (a crear)
import ZoneMap from "./ZoneMap";
import { supabase } from "../../services/supabase/client";
import { useToast } from "../../hooks/use-toast";
import { Dialog as Modal, DialogContent as ModalContent, DialogHeader as ModalHeader, DialogTitle as ModalTitle, DialogFooter as ModalFooter, DialogClose as ModalClose } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

// Convierte el array de Leaflet a GeoJSON Polygon
function leafletToGeoJSONPolygon(latlngs: any): any {
  // Si es un solo polígono
  let arr = latlngs;
  if (Array.isArray(arr) && Array.isArray(arr[0])) {
    arr = arr[0];
  }
  const coordinates = arr.map((point: any) => [point.lng, point.lat]);
  // Cerrar el polígono si no está cerrado
  if (coordinates.length && (coordinates[0][0] !== coordinates[coordinates.length-1][0] || coordinates[0][1] !== coordinates[coordinates.length-1][1])) {
    coordinates.push(coordinates[0]);
  }
  return {
    type: 'Polygon',
    coordinates: [coordinates]
  };
}

const ZoneManager: React.FC = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [polygonCoords, setPolygonCoords] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoneFilter, setZoneFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isActive, setIsActive] = useState(true);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [editZone, setEditZone] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);

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
    const geojsonPolygon = leafletToGeoJSONPolygon(polygonCoords);
    const { data, error } = await supabase.from("zones").insert({
      name: zoneName,
      transport_cost: parseFloat(transportCost),
      coordinates: geojsonPolygon,
      is_active: isActive,
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
      setIsActive(true);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta zona?')) return;
    setLoading(true);
    const { error } = await supabase.from('zones').delete().eq('id', zoneId);
    setLoading(false);
    if (error) {
      toast({ title: 'Error al eliminar zona', description: error.message, variant: 'destructive' });
      return;
    }
    setZones((prev) => prev.filter(z => z.id !== zoneId));
    toast({ title: 'Zona eliminada', description: 'La zona fue eliminada correctamente.' });
  };

  // useEffect para sincronizar editZone con selectedZone
  useEffect(() => {
    if (selectedZone) setEditZone({ ...selectedZone });
  }, [selectedZone]);

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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="isActive" className="select-none cursor-pointer">Zona habilitada</label>
                </div>
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
          {polygonCoords && (
            <button
              type="button"
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              onClick={() => {
                setPolygonCoords(null);
                setDialogOpen(false);
              }}
            >
              Eliminar polígono
            </button>
          )}
          {/* Filtro de zonas */}
          <div className="mb-4 flex gap-2 items-center">
            <span>Mostrar:</span>
            <button className={`px-2 py-1 rounded ${zoneFilter === 'all' ? 'bg-blue-100' : ''}`} onClick={() => setZoneFilter('all')}>Todas</button>
            <button className={`px-2 py-1 rounded ${zoneFilter === 'active' ? 'bg-green-100' : ''}`} onClick={() => setZoneFilter('active')}>Habilitadas</button>
            <button className={`px-2 py-1 rounded ${zoneFilter === 'inactive' ? 'bg-red-100' : ''}`} onClick={() => setZoneFilter('inactive')}>No habilitadas</button>
          </div>
          {/* Lista de zonas */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mt-6">
            <h2 className="text-lg font-semibold mb-2">Zonas existentes</h2>
            {zones.filter(zone =>
              zoneFilter === 'all' ? true : zoneFilter === 'active' ? zone.is_active : !zone.is_active
            ).length === 0 && <span className="text-gray-500">No hay zonas para mostrar.</span>}
            {zones.filter(zone =>
              zoneFilter === 'all' ? true : zoneFilter === 'active' ? zone.is_active : !zone.is_active
            ).map((zone) => (
              <div key={zone.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="cursor-pointer" onClick={() => setSelectedZone(zone)}>
                  <span className="font-medium">{zone.name}</span> <span className="text-xs text-gray-500">({zone.is_active ? 'Habilitada' : 'No habilitada'})</span>
                </div>
                <button
                  className="text-red-600 hover:underline text-sm"
                  onClick={() => handleDeleteZone(zone.id)}
                  disabled={loading}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          {/* Modal de detalles/edición de zona */}
          <Modal open={!!selectedZone} onOpenChange={open => { if (!open) setSelectedZone(null); }}>
            <ModalContent className="pb-16">
              <ModalHeader>
                <ModalTitle>Detalles de la zona</ModalTitle>
              </ModalHeader>
              {selectedZone && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  const { data, error } = await supabase.from('zones').update({
                    name: editZone.name,
                    transport_cost: parseFloat(editZone.transport_cost),
                    is_active: editZone.is_active,
                    coordinates: editZone.coordinates ?? null,
                    updated_at: new Date().toISOString(),
                  }).eq('id', selectedZone.id).select();
                  setEditLoading(false);
                  if (error) {
                    toast({ title: 'Error al actualizar zona', description: error.message, variant: 'destructive' });
                  } else {
                    setZones(zones.map(z => z.id === selectedZone.id ? { ...z, ...editZone } : z));
                    toast({ title: 'Zona actualizada', description: 'Los cambios fueron guardados.' });
                    setSelectedZone(null);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <Input value={editZone?.name ?? ''} onChange={e => setEditZone((z: any) => ({ ...z, name: e.target.value }))} disabled={editLoading} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Costo de transporte</label>
                    <Input type="number" min="0" value={editZone?.transport_cost ?? ''} onChange={e => setEditZone((z: any) => ({ ...z, transport_cost: e.target.value }))} disabled={editLoading} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="editIsActive" checked={!!editZone?.is_active} onChange={e => setEditZone((z: any) => ({ ...z, is_active: e.target.checked }))} disabled={editLoading} />
                    <label htmlFor="editIsActive" className="select-none cursor-pointer">Zona habilitada</label>
                  </div>
                  {/* En el modal de detalles/edición de zona: */}
                  <div className="my-4">
                    <div className="w-full h-60 rounded overflow-hidden border bg-white relative z-10">
                      <div className="w-full h-full z-0">
                        {editZone?.coordinates ? (
                          <ZoneMap polygonCoords={editZone.coordinates} />
                        ) : (
                          <ZoneMap onPolygonDrawn={(coords: any) => {
                            // Convertir a GeoJSON como en el alta
                            let arr = coords;
                            if (Array.isArray(arr) && Array.isArray(arr[0])) arr = arr[0];
                            const geojson = {
                              type: 'Polygon',
                              coordinates: [arr.map((point: any) => [point.lng, point.lat].map(Number))]
                            };
                            // Cerrar el polígono si es necesario
                            if (geojson.coordinates[0].length && (geojson.coordinates[0][0][0] !== geojson.coordinates[0][geojson.coordinates[0].length-1][0] || geojson.coordinates[0][0][1] !== geojson.coordinates[0][geojson.coordinates[0].length-1][1])) {
                              geojson.coordinates[0].push([...geojson.coordinates[0][0]]);
                            }
                            setEditZone((z: any) => ({ ...z, coordinates: geojson }));
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedZone.coordinates && (
                    <button
                      type="button"
                      className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      onClick={async () => {
                        setEditLoading(true);
                        const { error } = await supabase.from('zones').update({ coordinates: null, updated_at: new Date().toISOString() }).eq('id', selectedZone.id);
                        setEditLoading(false);
                        if (error) {
                          toast({ title: 'Error al eliminar polígono', description: error.message, variant: 'destructive' });
                        } else {
                          setZones(zones.map(z => z.id === selectedZone.id ? { ...z, coordinates: null } : z));
                          setEditZone((z: any) => ({ ...z, coordinates: null }));
                          toast({ title: 'Polígono eliminado', description: 'El polígono fue eliminado de la zona.' });
                          // No cerrar el modal
                        }
                      }}
                      disabled={editLoading}
                    >
                      Eliminar polígono
                    </button>
                  )}
                  <ModalFooter>
                    <Button type="submit" disabled={editLoading}>Guardar cambios</Button>
                    <ModalClose asChild>
                      <Button type="button" variant="secondary" onClick={() => setSelectedZone(null)} disabled={editLoading}>Cancelar</Button>
                    </ModalClose>
                  </ModalFooter>
                </form>
              )}
            </ModalContent>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ZoneManager; 