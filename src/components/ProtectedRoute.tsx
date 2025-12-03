import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOrdersAccess?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireOrdersAccess = false 
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, canManageOrders } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireOrdersAccess && !canManageOrders) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}