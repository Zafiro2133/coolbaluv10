import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { activateAccount, resendActivationEmail } from '../services/supabase/activateAccount';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ActivateAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleActivation();
    }
  }, [token]);

  const handleActivation = async () => {
    if (!token) return;

    setLoading(true);
    setStatus('pending');

    try {
      const result = await activateAccount(token);
      
      if (result.success) {
        setStatus('success');
        toast({
          title: "¡Cuenta activada!",
          description: "Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión.",
        });
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        setStatus('error');
        setErrorMessage(result.error?.message || 'Error desconocido');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);

    try {
      const result = await resendActivationEmail(email);
      
      if (result.success) {
        toast({
          title: "Email enviado",
          description: "Se ha enviado un nuevo email de activación a tu correo electrónico.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error?.message || 'Error al enviar email',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Token Inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              El enlace de activación no es válido o ha expirado.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingresa tu email para recibir un nuevo enlace
                </label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleResendEmail} 
                disabled={resendLoading}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {resendLoading ? 'Enviando...' : 'Reenviar Email'}
              </Button>
            </div>
            <div className="text-center">
              <Link to="/auth" className="text-blue-600 hover:text-blue-800 text-sm">
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'pending' && (
            <CardTitle className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              Activando Cuenta
            </CardTitle>
          )}
          {status === 'success' && (
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              ¡Cuenta Activada!
            </CardTitle>
          )}
          {status === 'error' && (
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Error de Activación
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'pending' && (
            <div className="text-center">
              <p className="text-gray-600">
                Estamos activando tu cuenta...
              </p>
              {loading && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                ¡Tu cuenta ha sido activada exitosamente! Ya puedes iniciar sesión y disfrutar de todos nuestros servicios.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  Serás redirigido automáticamente al login en unos segundos...
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/auth">
                  Ir al Login
                </Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  {errorMessage}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingresa tu email para recibir un nuevo enlace
                  </label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleResendEmail} 
                  disabled={resendLoading}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {resendLoading ? 'Enviando...' : 'Reenviar Email'}
                </Button>
              </div>
              
              <div className="text-center">
                <Link to="/auth" className="text-blue-600 hover:text-blue-800 text-sm">
                  Volver al login
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 