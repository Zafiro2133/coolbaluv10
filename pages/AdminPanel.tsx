import React, { useState } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminHeader } from '@/components/AdminHeader';

// Importaciones directas de componentes admin
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ReservationManagement } from '@/components/admin/ReservationManagement';
import { CatalogManagement } from '@/components/admin/CatalogManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemConfiguration } from '@/components/admin/SystemConfiguration';

import AdminAvailabilities from './AdminAvailabilities';
import EmailLogs from '@/components/admin/EmailLogs';

import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Users,
  Clock,
  Settings,
  Mail
} from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';


const adminMenuItems = [
  { 
    id: 'dashboard', 
    title: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Vista general y estadísticas'
  },
  { 
    id: 'reservations', 
    title: 'Reservas', 
    icon: Calendar,
    description: 'Gestionar reservas y pagos'
  },
  { 
    id: 'catalog', 
    title: 'Catálogo', 
    icon: Package,
    description: 'Productos y categorías'
  },

  { 
    id: 'users', 
    title: 'Usuarios', 
    icon: Users,
    description: 'Gestión de clientes'
  },
  {
    id: 'availabilities',
    title: 'Disponibilidades',
    icon: Clock,
    description: 'Fechas y horarios disponibles'
  },


  {
    id: 'settings',
    title: 'Configuración',
    icon: Settings,
    description: 'Configuración general del sistema'
  },
  {
    id: 'emails',
    title: 'Logs de Email',
    icon: Mail,
    description: 'Historial de emails enviados'
  },
];

function AdminSidebar({ activeSection, onSectionChange }: {
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  return (
    <Sidebar className="w-60" collapsible="none">
      <SidebarContent className="p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Panel Admin
          </h3>
          <p className="text-sm text-muted-foreground">
            Gestiona tu negocio
          </p>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full justify-start p-4 h-auto ${
                      activeSection === item.id 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {item.description}
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'reservations':
        return <ReservationManagement />;
      case 'catalog':
        return <CatalogManagement />;
      case 'users':
        return <UserManagement />;
      case 'availabilities':
        return <AdminAvailabilities />;

      case 'settings':
        return <SystemConfiguration />;
      case 'emails':
        return <EmailLogs />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
          
          <div className="flex-1 flex flex-col">
            
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-7xl mx-auto space-y-6">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminRoute>
  );
};

export default AdminPanel;
