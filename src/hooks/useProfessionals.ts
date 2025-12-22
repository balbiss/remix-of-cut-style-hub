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
  const { tenant } = useAuth();

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

  const addProfessional = async (data: Omit<Professional, 'id' | 'tenant_id'>) => {
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

  return {
    professionals,
    loading,
    refetch: fetchProfessionals,
    addProfessional,
    updateProfessional,
    deleteProfessional,
  };
}
