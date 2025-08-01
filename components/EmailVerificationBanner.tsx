import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Solo mostrar si el usuario está autenticado pero no tiene email confirmado
  if (!user || user.email_confirmed_at) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });

      if (error) {
        toast({
          title: "Error al reenviar email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email reenviado",
          description: "Revisa tu bandeja de entrada para confirmar tu cuenta.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reenviar el email de confirmación.",
        variant: "destructive",
      });
    }
  };

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <Mail className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="flex items-center justify-between">
          <span>
            Debes confirmar tu email antes de poder hacer reservas. 
            Revisa tu bandeja de entrada.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reenviar email
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 