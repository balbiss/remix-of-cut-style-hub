import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Professional {
  id: string;
  tenant_id: string;
  nome: string;
  avatar_url: string | null;
  telefone: string | null;
  especialidade: string | null;
  ativo: boolean;
  email: string | null;
  user_id: string | null;
  commission_percent: number;
  schedule: {
    useBusinessHours: boolean;
    workDays: number[];
    workHours: {
      morningStart?: string;
      morningEnd?: string;
      afternoonStart?: string;
      afternoonEnd?: string;
    };
  } | null;
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenant, session } = useAuth();

  const fetchProfessionals = async () => {
    if (!tenant?.id) {
      setProfessionals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('nome');

      if (error) throw error;

      const mapped: Professional[] = (data || []).map((p) => ({
        id: p.id,
        tenant_id: p.tenant_id,
        nome: p.nome,
        avatar_url: p.avatar_url,
        telefone: p.telefone,
        especialidade: p.especialidade,
        ativo: p.ativo ?? true,
        email: p.email,
        user_id: p.user_id,
        commission_percent: p.commission_percent ?? 50,
        schedule: p.schedule as Professional['schedule'],
      }));

      setProfessionals(mapped);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      toast.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, [tenant?.id]);

  const addProfessional = async (data: Omit<Professional, 'id' | 'tenant_id' | 'user_id'>) => {
    if (!tenant?.id) return null;

    try {
      const { data: newProfessional, error } = await supabase
        .from('professionals')
        .insert({
          tenant_id: tenant.id,
          nome: data.nome,
          avatar_url: data.avatar_url,
          telefone: data.telefone,
          especialidade: data.especialidade,
          ativo: data.ativo,
          email: data.email,
          commission_percent: data.commission_percent,
          schedule: data.schedule as any,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchProfessionals();
      return newProfessional;
    } catch (error) {
      console.error('Error adding professional:', error);
      toast.error('Erro ao adicionar profissional');
      return null;
    }
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          nome: data.nome,
          avatar_url: data.avatar_url,
          telefone: data.telefone,
          especialidade: data.especialidade,
          ativo: data.ativo,
          email: data.email,
          commission_percent: data.commission_percent,
          schedule: data.schedule as any,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchProfessionals();
      return true;
    } catch (error) {
      console.error('Error updating professional:', error);
      toast.error('Erro ao atualizar profissional');
      return false;
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProfessionals();
      return true;
    } catch (error) {
      console.error('Error deleting professional:', error);
      toast.error('Erro ao remover profissional');
      return false;
    }
  };

  const createBarberUser = async (
    professionalId: string,
    email: string,
    password: string,
    nome: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!tenant?.id || !session?.access_token) {
      return { success: false, error: 'Não autorizado' };
    }

    try {
      const response = await supabase.functions.invoke('create-barber-user', {
        body: {
          email,
          password,
          nome,
          professionalId,
          tenantId: tenant.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao criar usuário');
      }

      await fetchProfessionals();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating barber user:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    professionals,
    loading,
    refetch: fetchProfessionals,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    createBarberUser,
  };
}
