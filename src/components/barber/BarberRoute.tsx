import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BarberRouteProps {
  children: React.ReactNode;
}

export function BarberRoute({ children }: BarberRouteProps) {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isBarber) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
