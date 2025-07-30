import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface HookIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  stack?: string;
}

export function DebugHookIssues() {
  const [issues, setIssues] = useState<HookIssue[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    // Capturar errores relacionados con hooks
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const handleError = (level: 'error' | 'warning', ...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('hook') || message.includes('Hook') || message.includes('hook.js')) {
        setIssues(prev => [...prev, {
          type: level,
          message,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        }]);
      }
    };

    console.error = (...args) => {
      handleError('error', ...args);
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      handleError('warning', ...args);
      originalConsoleWarn.apply(console, args);
    };

    // Capturar errores globales
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.filename?.includes('hook.js') || event.message.includes('hook')) {
        setIssues(prev => [...prev, {
          type: 'error',
          message: event.message,
          timestamp: new Date().toISOString(),
          stack: event.error?.stack
        }]);
      }
    };

    window.addEventListener('error', handleGlobalError);

    // Verificar estado de React DevTools
    const checkReactDevTools = () => {
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        setIssues(prev => [...prev, {
          type: 'info',
          message: 'React DevTools está disponible',
          timestamp: new Date().toISOString()
        }]);
      } else {
        setIssues(prev => [...prev, {
          type: 'warning',
          message: 'React DevTools no está disponible',
          timestamp: new Date().toISOString()
        }]);
      }
    };

    checkReactDevTools();

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener('error', handleGlobalError);
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setIssues([]);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const clearIssues = () => {
    setIssues([]);
  };

  const getIssueIcon = (type: HookIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getIssueBadge = (type: HookIssue['type']) => {
    switch (type) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Debug Hook Issues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={startMonitoring}
            disabled={isMonitoring}
            variant="default"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Iniciar Monitoreo
          </Button>
          <Button
            onClick={stopMonitoring}
            disabled={!isMonitoring}
            variant="outline"
            size="sm"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Detener Monitoreo
          </Button>
          <Button
            onClick={clearIssues}
            variant="outline"
            size="sm"
          >
            Limpiar Issues
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitoreando" : "Detenido"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {issues.length} issues detectados
          </span>
        </div>

        {issues.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No se han detectado issues relacionados con hooks. Inicia el monitoreo para comenzar a detectar problemas.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {issues.map((issue, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-start gap-2">
                {getIssueIcon(issue.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getIssueBadge(issue.type)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(issue.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-mono">{issue.message}</p>
                  {issue.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Ver stack trace
                      </summary>
                      <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                        {issue.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 