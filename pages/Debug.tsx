import { DebugPanel } from '@/components/DebugPanel';
import DebugAvailabilities from '@/components/DebugAvailabilities';
import { DebugHookIssues } from '@/components/DebugHookIssues';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function DebugPage() {
  const { user } = useAuth();

  // Solo permitir acceso si el usuario está autenticado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔧 Panel de Debug - Error 406</h1>
        <DebugPanel />
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">🐛 Debug Hook Issues</h2>
          <DebugHookIssues />
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">📅 Debug Availabilities</h2>
          <DebugAvailabilities />
        </div>
      </div>
    </div>
  );
} 