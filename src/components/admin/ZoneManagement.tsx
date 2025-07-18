import { useState, useEffect } from 'react';
import { useUpdateZone } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Edit, Trash2, DollarSign, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Zone {
  id: string;
  name: string;
  description?: string;
  transport_cost: number;
  postal_codes?: string[];
  neighborhoods?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ZoneManagement() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const updateZoneMutation = useUpdateZone();
  const { toast } = useToast();

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (zoneData: any) => {
    try {
      const { data, error } = await supabase
        .from('zones')
        .insert(zoneData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Zona creada",
        description: "La zona ha sido creada exitosamente.",
      });
      setIsCreateDialogOpen(false);
      fetchZones();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la zona.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateZone = async (zoneData: any) => {
    try {
      await updateZoneMutation.mutateAsync({
        zoneId: selectedZone!.id,
        ...zoneData,
      });
      toast({
        title: "Zona actualizada",
        description: "La zona ha sido actualizada exitosamente.",
      });
      setIsEditDialogOpen(false);
      setSelectedZone(null);
      fetchZones();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la zona.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta zona?')) return;
    
    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: "Zona eliminada",
        description: "La zona ha sido eliminada exitosamente.",
      });
      fetchZones();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona.",
        variant: "destructive",
      });
    }
  };

  const toggleZoneStatus = async (zone: Zone) => {
    try {
      await updateZoneMutation.mutateAsync({
        zoneId: zone.id,
        is_active: !zone.is_active,
      });
      toast({
        title: "Estado actualizado",
        description: `La zona ha sido ${!zone.is_active ? 'activada' : 'desactivada'}.`,
      });
      fetchZones();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la zona.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Zonas</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Zona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Zona</DialogTitle>
            </DialogHeader>
            <ZoneForm onSubmit={handleCreateZone} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <Card key={zone.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {zone.name}
                  </CardTitle>
                  {zone.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {zone.description}
                    </p>
                  )}
                </div>
                <Badge variant={zone.is_active ? "default" : "secondary"}>
                  {zone.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Costo de Transporte */}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Transporte: <span className="font-medium">${zone.transport_cost.toLocaleString()}</span>
                  </span>
                </div>

                {/* Códigos Postales */}
                {zone.postal_codes && zone.postal_codes.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Códigos Postales:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {zone.postal_codes.slice(0, 3).map((code) => (
                        <Badge key={code} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                      {zone.postal_codes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{zone.postal_codes.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Barrios */}
                {zone.neighborhoods && zone.neighborhoods.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Barrios:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {zone.neighborhoods.slice(0, 2).map((neighborhood) => (
                        <Badge key={neighborhood} variant="outline" className="text-xs">
                          {neighborhood}
                        </Badge>
                      ))}
                      {zone.neighborhoods.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{zone.neighborhoods.length - 2} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleZoneStatus(zone)}
                    disabled={updateZoneMutation.isPending}
                  >
                    {zone.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedZone(zone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Editar Zona</DialogTitle>
                      </DialogHeader>
                      {selectedZone && (
                        <ZoneForm 
                          zone={selectedZone} 
                          onSubmit={handleUpdateZone} 
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteZone(zone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {zones.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay zonas registradas.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Crear primera zona</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Zone Form Component
function ZoneForm({ 
  zone, 
  onSubmit 
}: { 
  zone?: Zone; 
  onSubmit: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    name: zone?.name || '',
    description: zone?.description || '',
    transport_cost: zone?.transport_cost || 0,
    postal_codes: zone?.postal_codes?.join(', ') || '',
    neighborhoods: zone?.neighborhoods?.join(', ') || '',
    is_active: zone?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      postal_codes: formData.postal_codes 
        ? formData.postal_codes.split(',').map(code => code.trim()).filter(code => code.length > 0)
        : [],
      neighborhoods: formData.neighborhoods 
        ? formData.neighborhoods.split(',').map(neighborhood => neighborhood.trim()).filter(neighborhood => neighborhood.length > 0)
        : [],
    };
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nombre de la Zona *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ej: Zona Norte"
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Costo de Transporte *</label>
          <Input
            type="number"
            value={formData.transport_cost}
            onChange={(e) => setFormData({...formData, transport_cost: Number(e.target.value)})}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descripción de la zona..."
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Códigos Postales</label>
        <Input
          value={formData.postal_codes}
          onChange={(e) => setFormData({...formData, postal_codes: e.target.value})}
          placeholder="1000, 1001, 1002 (separados por comas)"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ingresa los códigos postales separados por comas
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Barrios</label>
        <Textarea
          value={formData.neighborhoods}
          onChange={(e) => setFormData({...formData, neighborhoods: e.target.value})}
          placeholder="Palermo, Recoleta, Belgrano (separados por comas)"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ingresa los barrios separados por comas
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {zone ? 'Actualizar' : 'Crear'} Zona
        </Button>
      </div>
    </form>
  );
}