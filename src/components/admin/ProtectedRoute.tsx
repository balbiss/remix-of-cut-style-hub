import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [isBarber, setIsBarber] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBarberRole = async () => {
      if (!user) {
        setIsBarber(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'barber')
          .maybeSingle();

        if (error) {
          console.error('Error checking barber role:', error);
          setIsBarber(false);
        } else {
          setIsBarber(!!data);
        }
      } catch (error) {
        console.error('Error checking barber role:', error);
        setIsBarber(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkBarberRole();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect barbers to their dedicated area
  if (isBarber) {
    return <Navigate to="/barbeiro" replace />;
  }

  return <>{children}</>;
}
