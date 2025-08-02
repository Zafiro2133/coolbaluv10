import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/client';
import { CheckCircle, XCircle, Loader2, ArrowRight, Mail, Home, AlertCircle, RefreshCw } from 'lucide-react';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Obtener todos los parámetros de la URL
        const allParams = Object.fromEntries(searchParams.entries());
        console.log('🔍 Parámetros de URL recibidos:', allParams);
        
        // Guardar información de debug
        setDebugInfo(JSON.stringify(allParams, null, 2));
        
        // Obtener parámetros específicos
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const next = searchParams.get('next');

        // Si hay un error en los parámetros
        if (error) {
          console.error('❌ Error en parámetros de URL:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error || 'Error en la confirmación del email');
          return;
        }

        // Caso 1: Si tenemos access_token, intentar establecer sesión
        if (accessToken) {
          console.log('📧 Intentando confirmar con access_token...');
          
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              console.error('❌ Error al establecer sesión:', sessionError);
              setStatus('error');
              setMessage('El enlace de confirmación ha expirado o es inválido. Por favor, solicita un nuevo enlace.');
              return;
            }

            if (data.session) {
              console.log('✅ Sesión establecida correctamente');
              setStatus('success');
              setMessage('¡Email confirmado exitosamente! Tu cuenta está lista para usar.');
              
              toast({
                title: "¡Email confirmado!",
                description: "Tu cuenta ha sido verificada exitosamente.",
              });
              return;
            }
          } catch (sessionError) {
            console.error('❌ Error al establecer sesión:', sessionError);
            setStatus('error');
            setMessage('Error al procesar la confirmación. Por favor, intenta nuevamente.');
            return;
          }
        }

        // Caso 2: Si tenemos token y type, usar verifyOtp
        if (token && type) {
          console.log('📧 Intentando confirmar con token y type...');
          
          try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type as any,
            });

            if (verifyError) {
              console.error('❌ Error al confirmar email con verifyOtp:', verifyError);
              setStatus('error');
              setMessage('El enlace de confirmación ha expirado o es inválido. Por favor, solicita un nuevo enlace.');
              return;
            }

            console.log('✅ Email confirmado con verifyOtp');
            setStatus('success');
            setMessage('¡Email confirmado exitosamente! Tu cuenta está lista para usar.');
            
            toast({
              title: "¡Email confirmado!",
              description: "Tu cuenta ha sido verificada exitosamente.",
            });
            return;
          } catch (verifyError) {
            console.error('❌ Error en verifyOtp:', verifyError);
            setStatus('error');
            setMessage('Error al procesar la confirmación. Por favor, intenta nuevamente.');
            return;
          }
        }

        // Caso 3: Si no tenemos parámetros específicos, verificar si ya está confirmado
        console.log('📧 No se detectaron parámetros específicos, verificando estado actual...');
        
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Error al obtener sesión:', sessionError);
          }
          
          if (session?.user?.email_confirmed_at) {
            console.log('✅ Usuario ya confirmado');
            setStatus('success');
            setMessage('¡Tu cuenta ya está confirmada! Ya puedes usar todos nuestros servicios.');
            
            toast({
              title: "¡Cuenta confirmada!",
              description: "Tu cuenta ya está verificada y lista para usar.",
            });
            return;
          }
        } catch (sessionError) {
          console.error('❌ Error al verificar sesión:', sessionError);
        }

        // Caso 4: Si llegamos aquí, no tenemos parámetros válidos
        console.error('❌ Parámetros insuficientes para confirmar email');
        console.log('📋 Parámetros recibidos:', allParams);
        
        setStatus('error');
        setMessage('Enlace de confirmación inválido o incompleto. Por favor, verifica el enlace o solicita uno nuevo.');

      } catch (error) {
        console.error('❌ Error inesperado:', error);
        setStatus('error');
        setMessage('Error inesperado al confirmar el email. Por favor, intenta nuevamente.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, toast]);

  const handleContinue = () => {
    navigate('/');
  };

  const handleGoToAuth = () => {
    navigate('/auth');
  };

  const handleResendEmail = async () => {
    setRetryCount(prev => prev + 1);
    toast({
      title: "Reenviando email",
      description: "Si el email no llega, verifica tu carpeta de spam.",
    });
    // Aquí podrías implementar la lógica para reenviar el email
  };

  const handleRetry = () => {
    setStatus('loading');
    setMessage('');
    // Recargar la página para intentar nuevamente
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              </div>
            )}
            {status === 'success' && (
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-pulse"></div>
              </div>
            )}
            {status === 'error' && (
              <div className="relative">
                <XCircle className="h-16 w-16 text-red-500" />
                <div className="absolute inset-0 rounded-full border-4 border-red-200"></div>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Confirmando email...'}
            {status === 'success' && '¡Email confirmado!'}
            {status === 'error' && 'Error de confirmación'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {status === 'loading' && 'Por favor espera mientras verificamos tu email...'}
            {status === 'success' && 'Tu cuenta ha sido verificada exitosamente'}
            {status === 'error' && 'Hubo un problema al confirmar tu email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm font-medium">
                  ¡Bienvenido a Coolbalu! Ya puedes acceder a todos nuestros servicios.
                </p>
              </div>
              <Button onClick={handleContinue} className="w-full bg-primary hover:bg-primary/90">
                Continuar al sitio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-red-800 text-sm font-medium mb-1">
                      ¿No recibiste el email?
                    </p>
                    <p className="text-red-700 text-xs">
                      Verifica tu carpeta de spam o solicita un nuevo enlace.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Intentar nuevamente
                </Button>
                <Button onClick={handleResendEmail} variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Reenviar email de confirmación
                </Button>
                <Button onClick={handleGoToAuth} variant="outline" className="w-full">
                  Ir a inicio de sesión
                </Button>
                <Button onClick={handleContinue} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Ir al inicio
                </Button>
              </div>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Esto puede tomar unos segundos...
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Si la página no responde, puedes:</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Verificar tu conexión a internet</li>
                  <li>• Recargar la página</li>
                  <li>• Contactar soporte si el problema persiste</li>
                </ul>
              </div>
            </div>
          )}

          {/* Debug info - solo mostrar en desarrollo */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Debug Info (Solo desarrollo)
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                {debugInfo}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation; 