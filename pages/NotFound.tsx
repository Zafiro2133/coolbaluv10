import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, ArrowLeft, Frown, MessageCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            {/* 404 Icon */}
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <Frown className="h-12 w-12 text-muted-foreground" />
            </div>
            
            {/* Error Message */}
            <div className="space-y-4 mb-8">
              <h1 className="text-6xl font-bold text-primary">404</h1>
              <h2 className="text-2xl font-semibold text-foreground">
                Página no encontrada
              </h2>
              <p className="text-muted-foreground">
                Lo sentimos, la página que estás buscando no existe o ha sido movida.
              </p>
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <span className="font-mono">{location.pathname}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-4 w-4" />
                Ir al Inicio
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={goBack}
                  className="w-full"
                  disabled={window.history.length <= 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/catalog')}
                  className="w-full"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Catálogo
                </Button>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/contact')}
                className="w-full"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contacto
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                ¿Necesitás ayuda? Probá con:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-xs"
                >
                  Inicio
                </Button>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => navigate('/catalog')}
                  className="text-xs"
                >
                  Productos
                </Button>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => navigate('/reservation')}
                  className="text-xs"
                >
                  Reservar
                </Button>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="text-xs"
                >
                  Mi Perfil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

    </div>
  );
};

export default NotFound;
