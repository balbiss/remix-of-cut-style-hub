import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DateBlock {
  id: string;
  tenant_id: string;
  date: string;
  description: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  professional_id: string | null;
}

export function useDateBlocks() {
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenant } = useAuth();

  const fetchDateBlocks = async () => {
    if (!tenant?.id) {
      setDateBlocks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('date_blocks')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('date');

      if (error) throw error;

      const mapped: DateBlock[] = (data || []).map((b) => ({
        id: b.id,
        tenant_id: b.tenant_id,
        date: b.date,
        description: b.description,
        all_day: b.all_day ?? true,
        start_time: b.start_time,
        end_time: b.end_time,
        professional_id: b.professional_id,
      }));

      setDateBlocks(mapped);
    } catch (error) {
      console.error('Error fetching date blocks:', error);
      toast.error('Erro ao carregar bloqueios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDateBlocks();
  }, [tenant?.id]);

  const addDateBlock = async (data: Omit<DateBlock, 'id' | 'tenant_id'>) => {
    if (!tenant?.id) return null;

    try {
      const { data: newBlock, error } = await supabase
        .from('date_blocks')
        .insert({
          tenant_id: tenant.id,
          date: data.date,
          description: data.description,
          all_day: data.all_day,
          start_time: data.start_time,
          end_time: data.end_time,
          professional_id: data.professional_id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchDateBlocks();
      return newBlock;
    } catch (error) {
      console.error('Error adding date block:', error);
      toast.error('Erro ao adicionar bloqueio');
      return null;
    }
  };

  const deleteDateBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('date_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchDateBlocks();
      return true;
    } catch (error) {
      console.error('Error deleting date block:', error);
      toast.error('Erro ao remover bloqueio');
      return false;
    }
  };

  return {
    dateBlocks,
    loading,
    refetch: fetchDateBlocks,
    addDateBlock,
    deleteDateBlock,
  };
}
