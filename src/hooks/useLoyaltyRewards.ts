import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LoyaltyReward {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  points_required: number;
  reward_type: 'service' | 'discount' | 'custom';
  reward_value: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useLoyaltyRewards() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRewards = async () => {
    if (!tenant?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('points_required', { ascending: true });

      if (error) throw error;
      setRewards((data || []) as LoyaltyReward[]);
    } catch (error) {
      console.error('Error fetching loyalty rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [tenant?.id]);

  const addReward = async (rewardData: Omit<LoyaltyReward, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    if (!tenant?.id) return;

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .insert({
          ...rewardData,
          tenant_id: tenant.id,
        });

      if (error) throw error;

      await fetchRewards();
      toast({
        title: 'Recompensa criada!',
        description: `A recompensa "${rewardData.nome}" foi adicionada.`,
      });
    } catch (error) {
      console.error('Error adding reward:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar a recompensa.',
        variant: 'destructive',
      });
    }
  };

  const updateReward = async (id: string, rewardData: Partial<LoyaltyReward>) => {
    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .update(rewardData)
        .eq('id', id);

      if (error) throw error;

      await fetchRewards();
      toast({
        title: 'Recompensa atualizada!',
      });
    } catch (error) {
      console.error('Error updating reward:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a recompensa.',
        variant: 'destructive',
      });
    }
  };

  const deleteReward = async (id: string) => {
    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchRewards();
      toast({
        title: 'Recompensa removida!',
      });
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover a recompensa.',
        variant: 'destructive',
      });
    }
  };

  return {
    rewards,
    activeRewards: rewards.filter(r => r.active),
    isLoading,
    addReward,
    updateReward,
    deleteReward,
    refetch: fetchRewards,
  };
}
