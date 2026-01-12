import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoyaltyReward } from './useLoyaltyRewards';
import { sendTextMessage } from '@/lib/whatsapp-api';

export interface ClientLoyaltyData {
  pontos: number;
  total_earned: number;
  total_redeemed: number;
  cliente_zap: string;
  cliente_nome?: string;
}

export function useClientLoyalty(tenantId: string | null, phone: string | null) {
  const { toast } = useToast();
  const [loyaltyData, setLoyaltyData] = useState<ClientLoyaltyData | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);

  const fetchClientLoyalty = async () => {
    if (!tenantId || !phone) {
      setLoyaltyData(null);
      setRewards([]);
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar pontos do cliente
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('cliente_zap', phone)
        .maybeSingle();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }

      // Buscar nome do cliente
      const { data: clientData } = await supabase
        .from('clients')
        .select('nome')
        .eq('tenant_id', tenantId)
        .eq('telefone', phone)
        .maybeSingle();

      if (clientData) {
        setClientName(clientData.nome);
      }

      // Buscar recompensas ativas
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('points_required', { ascending: true });

      if (rewardsError) throw rewardsError;

      if (pointsData) {
        setLoyaltyData({
          pontos: pointsData.pontos || 0,
          total_earned: (pointsData as any).total_earned || 0,
          total_redeemed: (pointsData as any).total_redeemed || 0,
          cliente_zap: pointsData.cliente_zap,
          cliente_nome: clientData?.nome || null,
        });
      } else {
        // Cliente não tem pontos ainda
        setLoyaltyData({
          pontos: 0,
          total_earned: 0,
          total_redeemed: 0,
          cliente_zap: phone,
          cliente_nome: clientData?.nome || null,
        });
      }

      setRewards((rewardsData || []) as LoyaltyReward[]);
    } catch (error: any) {
      console.error('Error fetching client loyalty:', error);
      toast({
        title: 'Erro ao carregar',
        description: error.message || 'Não foi possível carregar seus pontos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gerar código de validação de 6 dígitos
  const generateValidationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const redeemReward = async (rewardId: string, pointsRequired: number) => {
    if (!tenantId || !phone || !loyaltyData) return false;

    if (loyaltyData.pontos < pointsRequired) {
      toast({
        title: 'Pontos insuficientes',
        description: `Você precisa de ${pointsRequired} pontos para resgatar esta recompensa.`,
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Buscar dados do cliente e tenant
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('telefone', phone)
        .maybeSingle();

      if (!clientData) {
        throw new Error('Cliente não encontrado');
      }

      // Buscar dados da recompensa
      const { data: rewardData } = await supabase
        .from('loyalty_rewards')
        .select('nome, reward_type, reward_value')
        .eq('id', rewardId)
        .single();

      if (!rewardData) {
        throw new Error('Recompensa não encontrada');
      }

      // Buscar dados do tenant (nome da barbearia)
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', tenantId)
        .single();

      // Gerar código de validação
      const validationCode = generateValidationCode();
      
      // Definir expiração (24 horas)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Criar registro de resgate com código (SEM DEDUZIR PONTOS AINDA)
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('loyalty_redemptions')
        .insert({
          tenant_id: tenantId,
          client_id: clientData.id,
          reward_id: rewardId,
          points_spent: pointsRequired,
          status: 'pending',
          validation_code: validationCode,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (redemptionError) throw redemptionError;

      // Buscar conexão WhatsApp do tenant
      const { data: connection } = await supabase
        .from('connections')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'online')
        .maybeSingle();

      // Enviar código via WhatsApp
      if (connection?.api_instance_token) {
        const barbershopName = tenantData?.nome || 'Barbearia';
        const rewardName = rewardData.nome;
        
        const message = `*${barbershopName}*\n\n` +
          `Olá ${clientData.nome || 'Cliente'}! 🎁\n\n` +
          `Você solicitou o resgate da recompensa: *${rewardName}*\n\n` +
          `*Código de validação:*\n` +
          `\`\`\`${validationCode}\`\`\`\n\n` +
          `Apresente este código ao barbeiro para confirmar o resgate.\n\n` +
          `⚠️ Este código expira em 24 horas.\n\n` +
          `Obrigado pela preferência! 🙏`;

        await sendTextMessage(
          connection.instance_name,
          phone,
          message,
          connection.api_instance_token
        );
      }

      // Recarregar dados
      await fetchClientLoyalty();

      toast({
        title: 'Código enviado!',
        description: `Enviamos um código de validação para seu WhatsApp. Apresente ao barbeiro para confirmar o resgate.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      toast({
        title: 'Erro ao resgatar',
        description: error.message || 'Não foi possível processar o resgate.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (tenantId && phone) {
      fetchClientLoyalty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, phone]);

  return {
    loyaltyData,
    rewards,
    clientName,
    isLoading,
    refetch: fetchClientLoyalty,
    redeemReward,
  };
}

