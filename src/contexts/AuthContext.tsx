import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Tenant {
  id: string;
  nome: string;
  plan: string | null;
  plan_status: string | null;
  plan_activated_at: string | null;
  plan_expires_at: string | null;
  payment_status: string | null;
  logo_url: string | null;
}

interface UserData {
  id: string;
  email: string;
  nome: string | null;
  tenant_id: string | null;
  role: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userData: UserData | null;
  tenant: Tenant | null;
  loading: boolean;
  isSubscriptionActive: boolean;
  signUp: (email: string, password: string, nome: string, barbeariaNome: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const isSubscriptionActive = tenant?.plan_status === 'active' && 
    (!tenant?.plan_expires_at || new Date(tenant.plan_expires_at) > new Date());

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
    return data as UserData;
  };

  const fetchTenant = async (tenantId: string) => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
    return data as Tenant;
  };

  const refreshTenant = async () => {
    if (userData?.tenant_id) {
      const tenantData = await fetchTenant(userData.tenant_id);
      setTenant(tenantData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            const userDataResult = await fetchUserData(session.user.id);
            setUserData(userDataResult);
            
            if (userDataResult?.tenant_id) {
              const tenantData = await fetchTenant(userDataResult.tenant_id);
              setTenant(tenantData);
            }
            setLoading(false);
          }, 0);
        } else {
          setUserData(null);
          setTenant(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id).then((userDataResult) => {
          setUserData(userDataResult);
          
          if (userDataResult?.tenant_id) {
            fetchTenant(userDataResult.tenant_id).then((tenantData) => {
              setTenant(tenantData);
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nome: string, barbeariaNome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome,
          barbearia_nome: barbeariaNome,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userData,
        tenant,
        loading,
        isSubscriptionActive,
        signUp,
        signIn,
        signOut,
        refreshTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
