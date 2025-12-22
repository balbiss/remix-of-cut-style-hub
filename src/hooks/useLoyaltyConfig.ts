import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LoyaltyConfig {
  id: string;
  tenant_id: string;
  enabled: boolean;
  points_type: 'visit' | 'amount';
  points_per_visit: number;
  points_per_real: number;
  min_amount_for_points: number;
  created_at: string;
  updated_at: string;
}

export function useLoyaltyConfig() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    if (!tenant?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loyalty_config')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as LoyaltyConfig | null);
    } catch (error) {
      console.error('Error fetching loyalty config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [tenant?.id]);

  const saveConfig = async (configData: Partial<LoyaltyConfig>) => {
    if (!tenant?.id) return;

    try {
      const payload = {
        ...configData,
        tenant_id: tenant.id,
      };

      if (config?.id) {
        const { error } = await supabase
          .from('loyalty_config')
          .update(payload)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_config')
          .insert(payload);

        if (error) throw error;
      }

      await fetchConfig();
      toast({
        title: 'Configuração salva!',
        description: 'As configurações de fidelidade foram atualizadas.',
      });
    } catch (error) {
      console.error('Error saving loyalty config:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  return {
    config,
    isLoading,
    saveConfig,
    refetch: fetchConfig,
  };
}
