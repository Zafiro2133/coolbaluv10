import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/client';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('🔍 Parámetros de URL recibidos:', Object.fromEntries(searchParams.entries()));
        
        // Obtener todos los parámetros posibles
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Si hay un error en los parámetros
        if (error) {
          console.error('Error en parámetros de URL:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error || 'Error en la confirmación');
          return;
        }

        // Si tenemos access_token, intentar confirmar directamente
        if (accessToken) {
          console.log('📧 Confirmando con access_token...');
          
          try {
            // Intentar establecer la sesión con el access_token
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              console.error('Error al establecer sesión:', sessionError);
              setStatus('error');
              setMessage(sessionError.message || 'Error al confirmar el email');
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
            console.error('Error al establecer sesión:', sessionError);
          }
        }

        // Si tenemos token y type, usar verifyOtp
        if (token && type) {
          console.log('📧 Confirmando con token y type...');
          
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any,
          });

          if (verifyError) {
            console.error('Error al confirmar email con verifyOtp:', verifyError);
            setStatus('error');
            setMessage(verifyError.message || 'Error al confirmar el email');
            return;
          }

          setStatus('success');
          setMessage('¡Email confirmado exitosamente! Tu cuenta está lista para usar.');
          
          toast({
            title: "¡Email confirmado!",
            description: "Tu cuenta ha sido verificada exitosamente.",
          });
          return;
        }

        // Si no tenemos los parámetros necesarios
        console.error('❌ Parámetros insuficientes para confirmar email');
        setStatus('error');
        setMessage('Enlace de confirmación inválido o incompleto');

      } catch (error) {
        console.error('Error inesperado:', error);
        setStatus('error');
        setMessage('Error inesperado al confirmar el email');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Confirmando email...'}
            {status === 'success' && '¡Email confirmado!'}
            {status === 'error' && 'Error de confirmación'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Por favor espera mientras verificamos tu email...'}
            {status === 'success' && 'Tu cuenta ha sido verificada exitosamente'}
            {status === 'error' && 'Hubo un problema al confirmar tu email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          
          {status === 'success' && (
            <Button onClick={handleContinue} className="w-full">
              Continuar al sitio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button onClick={handleGoToAuth} variant="outline" className="w-full">
                Ir a inicio de sesión
              </Button>
              <Button onClick={handleContinue} className="w-full">
                Ir al inicio
              </Button>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-sm text-muted-foreground">
              Esto puede tomar unos segundos...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation; 