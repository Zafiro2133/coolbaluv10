import { useState } from 'react';
import { useSystemSettings, useUpdateSystemSetting, SystemSetting } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  DollarSign, 
  Clock, 
  Truck, 
  Building, 
  Phone, 
  Mail, 
  Calendar,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function SystemConfiguration() {
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedBusinessHours, setEditedBusinessHours] = useState<any>(null);
  
  const { data: settings, isLoading, refetch } = useSystemSettings();
  const updateSettingMutation = useUpdateSystemSetting();
  const { toast } = useToast();

  const handleEditSetting = (settingKey: string, currentValue: string) => {
    setEditingSettings(prev => ({
      ...prev,
      [settingKey]: currentValue
    }));
    setIsEditing(true);
    
    // Inicializar horarios editados si es business_hours
    if (settingKey === 'business_hours') {
      try {
        const businessHours = JSON.parse(currentValue);
        setEditedBusinessHours(businessHours);
      } catch (error) {
        console.error('Error parsing business hours:', error);
      }
    }
  };

  const handleSaveSetting = async (settingKey: string) => {
    const newValue = editingSettings[settingKey];
    if (!newValue) return;

    try {
      await updateSettingMutation.mutateAsync({
        settingKey,
        settingValue: newValue
      });
      
      toast({
        title: "Configuración actualizada",
        description: "La configuración se ha guardado correctamente.",
      });
      
      setEditingSettings(prev => {
        const newState = { ...prev };
        delete newState[settingKey];
        return newState;
      });
      
      // Limpiar horarios editados si es business_hours
      if (settingKey === 'business_hours') {
        setEditedBusinessHours(null);
      }
      
      if (Object.keys(editingSettings).length === 1) {
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (settingKey: string) => {
    setEditingSettings(prev => {
      const newState = { ...prev };
      delete newState[settingKey];
      return newState;
    });
    
    // Limpiar horarios editados si es business_hours
    if (settingKey === 'business_hours') {
      setEditedBusinessHours(null);
    }
    
    if (Object.keys(editingSettings).length === 1) {
      setIsEditing(false);
    }
  };

  const getSettingIcon = (settingKey: string) => {
    const iconMap: Record<string, any> = {
      extra_hour_cost: DollarSign,
      base_event_duration: Clock,
      max_extra_hours: Clock,
      transport_cost_base: Truck,
      company_name: Building,
      contact_email: Mail,
      contact_phone: Phone,
      business_hours: Calendar,
      currency: DollarSign,
    };
    return iconMap[settingKey] || Settings;
  };

  const getSettingCategory = (settingKey: string) => {
    if (settingKey.includes('cost') || settingKey.includes('price') || settingKey === 'currency') {
      return 'Precios y Costos';
    }
    if (settingKey.includes('duration') || settingKey.includes('hours')) {
      return 'Duración y Horarios';
    }
    if (settingKey.includes('contact') || settingKey.includes('company')) {
      return 'Información de Contacto';
    }
    if (settingKey.includes('business')) {
      return 'Horarios de Negocio';
    }
    return 'General';
  };

  const getSettingDisplayName = (settingKey: string) => {
    const nameMap: Record<string, string> = {
      extra_hour_cost: 'Costo por Hora Extra',
      base_event_duration: 'Duración Base del Evento',
      max_extra_hours: 'Horas Extra Máximas',
      transport_cost_base: 'Costo Base de Traslado y Montaje',
      company_name: 'Nombre de la Empresa',
      contact_email: 'Correo de Contacto',
      contact_phone: 'Teléfono de Contacto',
      business_hours: 'Horarios de Atención',
      currency: 'Moneda',
    };
    return nameMap[settingKey] || settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderSettingValue = (setting: SystemSetting) => {
    const isEditing = editingSettings.hasOwnProperty(setting.setting_key);
    const currentValue = editingSettings[setting.setting_key] || setting.setting_value;

    switch (setting.setting_type) {
      case 'number':
        return (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setEditingSettings(prev => ({
                    ...prev,
                    [setting.setting_key]: e.target.value
                  }))}
                  className="w-32"
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting(setting.setting_key)}
                  disabled={updateSettingMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelEdit(setting.setting_key)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <span className="font-mono text-lg">
                  {setting.setting_key.includes('cost') || setting.setting_key.includes('price') 
                    ? `$${Number(setting.setting_value).toLocaleString()}`
                    : setting.setting_value
                  }
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditSetting(setting.setting_key, setting.setting_value)}
                >
                  Editar
                </Button>
              </>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={setting.setting_value === 'true'}
              onCheckedChange={(checked) => {
                setEditingSettings(prev => ({
                  ...prev,
                  [setting.setting_key]: checked.toString()
                }));
                handleSaveSetting(setting.setting_key);
              }}
            />
            <Badge variant={setting.setting_value === 'true' ? 'default' : 'secondary'}>
              {setting.setting_value === 'true' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        );

      case 'json':
        // Renderizado especial para horarios de atención
        if (setting.setting_key === 'business_hours') {
          try {
            const businessHours = JSON.parse(setting.setting_value);
            const isEditing = editingSettings.hasOwnProperty(setting.setting_key);
            
            if (isEditing) {
              const currentHours = editedBusinessHours || businessHours;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(currentHours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="font-medium capitalize min-w-[80px]">
                          {day === 'monday' ? 'Lunes' :
                           day === 'tuesday' ? 'Martes' :
                           day === 'wednesday' ? 'Miércoles' :
                           day === 'thursday' ? 'Jueves' :
                           day === 'friday' ? 'Viernes' :
                           day === 'saturday' ? 'Sábado' :
                           day === 'sunday' ? 'Domingo' : day}
                        </span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={hours.open || ''}
                            onChange={(e) => {
                              const newHours = { ...currentHours };
                              newHours[day] = { ...newHours[day], open: e.target.value };
                              setEditedBusinessHours(newHours);
                              setEditingSettings(prev => ({
                                ...prev,
                                [setting.setting_key]: JSON.stringify(newHours)
                              }));
                            }}
                            className="w-24"
                            placeholder="Abrir"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={hours.close || ''}
                            onChange={(e) => {
                              const newHours = { ...currentHours };
                              newHours[day] = { ...newHours[day], close: e.target.value };
                              setEditedBusinessHours(newHours);
                              setEditingSettings(prev => ({
                                ...prev,
                                [setting.setting_key]: JSON.stringify(newHours)
                              }));
                            }}
                            className="w-24"
                            placeholder="Cerrar"
                          />
                          <Switch
                            checked={hours.open && hours.close}
                            onCheckedChange={(checked) => {
                              const newHours = { ...currentHours };
                              if (checked) {
                                newHours[day] = { open: '09:00', close: '18:00' };
                              } else {
                                newHours[day] = { open: null, close: null };
                              }
                              setEditedBusinessHours(newHours);
                              setEditingSettings(prev => ({
                                ...prev,
                                [setting.setting_key]: JSON.stringify(newHours)
                              }));
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {hours.open && hours.close ? 'Abierto' : 'Cerrado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveSetting(setting.setting_key)}
                      disabled={updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelEdit(setting.setting_key)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              );
            }
            
            return (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(businessHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span className="font-medium capitalize">
                        {day === 'monday' ? 'Lunes' :
                         day === 'tuesday' ? 'Martes' :
                         day === 'wednesday' ? 'Miércoles' :
                         day === 'thursday' ? 'Jueves' :
                         day === 'friday' ? 'Viernes' :
                         day === 'saturday' ? 'Sábado' :
                         day === 'sunday' ? 'Domingo' : day}
                      </span>
                      <span className="text-muted-foreground">
                        {hours.open ? `${hours.open} - ${hours.close}` : 'Cerrado'}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditSetting(setting.setting_key, setting.setting_value)}
                >
                  Editar
                </Button>
              </div>
            );
          } catch (error) {
            // Si hay error al parsear, mostrar mensaje de error
            return (
              <div className="text-sm text-destructive">
                Error al cargar los horarios
              </div>
            );
          }
        }
        
        // Para otros tipos JSON, mostrar el contenido parseado
        try {
          const jsonData = JSON.parse(setting.setting_value);
          return (
            <div className="text-sm">
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(jsonData, null, 2)}
              </pre>
            </div>
          );
        } catch (error) {
          return (
            <div className="text-sm text-destructive">
              Error al cargar la configuración
            </div>
          );
        }

      default:
        return (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Input
                  value={currentValue}
                  onChange={(e) => setEditingSettings(prev => ({
                    ...prev,
                    [setting.setting_key]: e.target.value
                  }))}
                  className="w-64"
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting(setting.setting_key)}
                  disabled={updateSettingMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelEdit(setting.setting_key)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm">{setting.setting_value}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditSetting(setting.setting_key, setting.setting_value)}
                >
                  Editar
                </Button>
              </>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Error al cargar las configuraciones</p>
      </div>
    );
  }

  // Agrupar configuraciones por categoría
  const groupedSettings = settings.reduce((acc, setting) => {
    const category = getSettingCategory(setting.setting_key);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración del Sistema
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Configuraciones agrupadas por categoría */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category === 'Precios y Costos' && <DollarSign className="h-5 w-5" />}
              {category === 'Duración y Horarios' && <Clock className="h-5 w-5" />}
              {category === 'Información de Contacto' && <Building className="h-5 w-5" />}
              {category === 'Horarios de Negocio' && <Calendar className="h-5 w-5" />}
              {category === 'General' && <Settings className="h-5 w-5" />}
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categorySettings.map((setting) => {
                const Icon = getSettingIcon(setting.setting_key);
                return (
                  <div key={setting.setting_key} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">
                              {getSettingDisplayName(setting.setting_key)}
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Última actualización: {format(new Date(setting.updated_at), 'dd MMM yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderSettingValue(setting)}
                      </div>
                    </div>
                    {categorySettings.indexOf(setting) < categorySettings.length - 1 && (
                      <Separator />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <strong>Configuraciones Públicas:</strong> Todas las configuraciones del sistema 
                son visibles públicamente y se actualizan en tiempo real en toda la aplicación.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <strong>Cambios en Tiempo Real:</strong> Los cambios en las configuraciones se aplican 
                inmediatamente en todo el sistema.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <strong>Precaución:</strong> Modificar configuraciones críticas como precios puede 
                afectar las reservas existentes. Se recomienda hacer cambios durante períodos de baja actividad.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 