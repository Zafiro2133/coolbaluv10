import { ArrowLeft, User, LogOut, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface AdminHeaderProps {
  currentSection: string;
}

export const AdminHeader = ({ currentSection }: AdminHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      reservations: 'Gestión de Reservas',
      catalog: 'Gestión de Catálogo',

      users: 'Gestión de Usuarios',
    };
    return titles[section] || 'Panel de Administración';
  };

  return (
    <header className="w-full bg-card/95 border-b border-border px-6 py-4 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <SidebarTrigger className="lg:hidden" />
          
          <div className="flex items-center gap-2 min-w-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Button>
            
            <div className="hidden md:flex">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={() => navigate('/')} className="flex items-center gap-1 cursor-pointer">
                      <Home className="h-4 w-4" />
                      Coolbalu
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">
                      {getSectionTitle(currentSection)}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <div className="md:hidden">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {getSectionTitle(currentSection)}
              </h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="secondary" className="text-xs hidden sm:flex">
            Admin
          </Badge>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};