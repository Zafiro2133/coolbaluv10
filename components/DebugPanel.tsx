import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debugAuthStatus, debugRequestHeaders } from '@/utils/debugUtils';
import { useAuth } from '@/contexts/AuthContext';

export function DebugPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string>('');
  const { user } = useAuth();

  const runDebug = async (debugFunction: () => Promise<void>) => {
    setIsLoading(true);
    setDebugOutput('');
    
    // Capturar console.log output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const logs: string[] = [];
    
    console.log = (...args) => {
      logs.push(`[LOG] ${args.join(' ')}`);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      logs.push(`[ERROR] ${args.join(' ')}`);
      originalError(...args);
    };
    
    console.warn = (...args) => {
      logs.push(`[WARN] ${args.join(' ')}`);
      originalWarn(...args);
    };
    
    try {
      await debugFunction();
    } catch (error) {
      logs.push(`[EXCEPTION] ${error}`);
    } finally {
      // Restaurar console original
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      setDebugOutput(logs.join('\n'));
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Panel de Debug - Error 406 user_roles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => runDebug(debugAuthStatus)}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Ejecutando...' : 'Debug Auth Status'}
          </Button>
          <Button 
            onClick={() => runDebug(debugRequestHeaders)}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Ejecutando...' : 'Debug Request Headers'}
          </Button>
        </div>
        
        {user && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Usuario actual:</h3>
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
          </div>
        )}
        
        {debugOutput && (
          <div className="p-4 bg-black text-green-400 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <pre>{debugOutput}</pre>
          </div>
        )}
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">📋 Pasos para resolver el error 406:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Ejecuta "Debug Auth Status" para verificar la autenticación</li>
            <li>Ejecuta "Debug Request Headers" para verificar los headers</li>
            <li>Ejecuta el script SQL en Supabase Dashboard</li>
            <li>Verifica que las políticas RLS estén correctas</li>
            <li>Revisa los logs en la consola del navegador</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
} 