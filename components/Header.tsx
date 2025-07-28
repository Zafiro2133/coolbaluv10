import { Menu, MessageCircle, BookOpen, User, LogOut, ShoppingCart, Calendar, Home, HelpCircle } from "lucide-react";
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
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCartContext } from '@/contexts/CartContext';
import { useCartItems } from '@/hooks/useCart';
import { useIsAdmin } from '@/hooks/useAdmin';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { openCart } = useCartContext();
  const { data: cartItems = [] } = useCartItems();
  const isAdmin = useIsAdmin();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    const titles: Record<string, string> = {
      '/': 'Inicio',
      '/catalog': 'Catálogo',
      '/contact': 'Contacto',
      '/auth': 'Iniciar Sesión',
      '/reservation': 'Reservar',
      '/profile': 'Mi Perfil',
      '/admin': 'Panel Admin',
      '/faq': 'Preguntas Frecuentes',
    };
    return titles[pathname] || 'Página';
  };

  const handleAuthClick = async () => {
    if (user) {
      await signOut();
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="w-full bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
              Coolbalu
            </Link>
            
            {/* Breadcrumbs */}
            {location.pathname !== '/' && (
              <div className="hidden md:flex">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={() => navigate('/')} className="flex items-center gap-1 cursor-pointer hover:text-primary">
                        <Home className="h-4 w-4" />
                        Inicio
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium">
                        {getPageTitle(location.pathname)}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Menu className="h-4 w-4" />
                Panel Admin
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/catalog')}
              className="rounded-full flex items-center gap-2 px-3"
            >
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline">Catálogo</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/reservation')}
              className="rounded-full flex items-center gap-2 px-3"
            >
              <Calendar className="h-5 w-5" />
              <span className="hidden sm:inline">Reservar</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/contact')}
              className="rounded-full flex items-center gap-2 px-3"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Contacto</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/faq')}
              className="rounded-full flex items-center gap-2 px-3"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Preguntas Frecuentes</span>
            </Button>
            {/* Enlace a Términos y Condiciones */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/TerminosYCondiciones')}
              className="rounded-full flex items-center gap-2 px-3"
            >
              <span className="hidden sm:inline">Términos y Condiciones</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <Badge 
                  variant="default" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartItems.length}
                </Badge>
              )}
            </Button>
            
            {user ? (
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
                  <DropdownMenuItem asChild>
                    <Link to="/reservation" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Reservar
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
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                className="rounded-full flex items-center gap-2 px-3"
                onClick={() => navigate('/auth')}
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </Button>
            )}
          </div>
        </div>
    </header>
  );
};