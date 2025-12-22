import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Service {
  id: string;
  tenant_id: string;
  nome: string;
  preco: number;
  duracao: number;
  descricao: string | null;
  ativo: boolean;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenant } = useAuth();

  const fetchServices = async () => {
    if (!tenant?.id) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('nome');

      if (error) throw error;

      const mapped: Service[] = (data || []).map((s) => ({
        id: s.id,
        tenant_id: s.tenant_id,
        nome: s.nome,
        preco: Number(s.preco),
        duracao: s.duracao,
        descricao: s.descricao,
        ativo: s.ativo ?? true,
      }));

      setServices(mapped);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [tenant?.id]);

  const addService = async (data: Omit<Service, 'id' | 'tenant_id'>) => {
    if (!tenant?.id) return null;

    try {
      const { data: newService, error } = await supabase
        .from('services')
        .insert({
          tenant_id: tenant.id,
          nome: data.nome,
          preco: data.preco,
          duracao: data.duracao,
          descricao: data.descricao,
          ativo: data.ativo,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchServices();
      return newService;
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Erro ao adicionar serviço');
      return null;
    }
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({
          nome: data.nome,
          preco: data.preco,
          duracao: data.duracao,
          descricao: data.descricao,
          ativo: data.ativo,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchServices();
      return true;
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Erro ao atualizar serviço');
      return false;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchServices();
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao remover serviço');
      return false;
    }
  };

  return {
    services,
    loading,
    refetch: fetchServices,
    addService,
    updateService,
    deleteService,
  };
}
