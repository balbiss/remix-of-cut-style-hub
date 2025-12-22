import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  tenant_id: string;
  nome: string;
  telefone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithPoints extends Client {
  pontos: number;
  total_earned: number;
  total_redeemed: number;
  visits: number;
}

export function useClients() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientWithPoints[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = async () => {
    if (!tenant?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('nome', { ascending: true });

      if (clientsError) throw clientsError;

      // Fetch loyalty points
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('tenant_id', tenant.id);

      if (pointsError) throw pointsError;

      // Fetch appointments count per client phone
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('cliente_zap')
        .eq('tenant_id', tenant.id)
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      // Create a map of phone to visits count
      const visitsMap: Record<string, number> = {};
      appointmentsData?.forEach(a => {
        visitsMap[a.cliente_zap] = (visitsMap[a.cliente_zap] || 0) + 1;
      });

      // Create a map of phone to points
      const pointsMap: Record<string, { pontos: number; total_earned: number; total_redeemed: number }> = {};
      pointsData?.forEach(p => {
        pointsMap[p.cliente_zap] = {
          pontos: p.pontos || 0,
          total_earned: (p as any).total_earned || 0,
          total_redeemed: (p as any).total_redeemed || 0,
        };
      });

      // Combine data
      const clientsWithPoints: ClientWithPoints[] = (clientsData || []).map(client => ({
        ...client,
        pontos: pointsMap[client.telefone]?.pontos || 0,
        total_earned: pointsMap[client.telefone]?.total_earned || 0,
        total_redeemed: pointsMap[client.telefone]?.total_redeemed || 0,
        visits: visitsMap[client.telefone] || 0,
      }));

      setClients(clientsWithPoints);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [tenant?.id]);

  const addClient = async (clientData: { nome: string; telefone: string; email?: string }) => {
    if (!tenant?.id) return;

    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          tenant_id: tenant.id,
        });

      if (error) throw error;

      await fetchClients();
      toast({
        title: 'Cliente adicionado!',
        description: `${clientData.nome} foi cadastrado.`,
      });
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: 'Erro ao adicionar',
        description: error.message || 'Não foi possível adicionar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id);

      if (error) throw error;

      await fetchClients();
      toast({
        title: 'Cliente atualizado!',
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const getClientPoints = async (telefone: string) => {
    if (!tenant?.id) return null;

    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('cliente_zap', telefone)
      .maybeSingle();

    if (error) {
      console.error('Error fetching client points:', error);
      return null;
    }

    return data;
  };

  const updateClientPoints = async (telefone: string, pointsToAdd: number) => {
    if (!tenant?.id) return;

    try {
      const existingPoints = await getClientPoints(telefone);

      if (existingPoints) {
        const { error } = await supabase
          .from('loyalty_points')
          .update({
            pontos: (existingPoints.pontos || 0) + pointsToAdd,
            total_earned: ((existingPoints as any).total_earned || 0) + pointsToAdd,
          })
          .eq('id', existingPoints.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_points')
          .insert({
            tenant_id: tenant.id,
            cliente_zap: telefone,
            pontos: pointsToAdd,
            total_earned: pointsToAdd,
            total_redeemed: 0,
          });

        if (error) throw error;
      }

      await fetchClients();
    } catch (error) {
      console.error('Error updating client points:', error);
      throw error;
    }
  };

  const redeemPoints = async (clientId: string, rewardId: string, pointsToRedeem: number) => {
    if (!tenant?.id) return;

    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) throw new Error('Cliente não encontrado');

      // Create redemption record
      const { error: redemptionError } = await supabase
        .from('loyalty_redemptions')
        .insert({
          tenant_id: tenant.id,
          client_id: clientId,
          reward_id: rewardId,
          points_spent: pointsToRedeem,
          status: 'pending',
        });

      if (redemptionError) throw redemptionError;

      // Update client points
      const existingPoints = await getClientPoints(client.telefone);
      if (existingPoints) {
        const { error } = await supabase
          .from('loyalty_points')
          .update({
            pontos: Math.max(0, (existingPoints.pontos || 0) - pointsToRedeem),
            total_redeemed: ((existingPoints as any).total_redeemed || 0) + pointsToRedeem,
          })
          .eq('id', existingPoints.id);

        if (error) throw error;
      }

      await fetchClients();
      toast({
        title: 'Resgate realizado!',
        description: `${pointsToRedeem} pontos foram resgatados.`,
      });
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast({
        title: 'Erro ao resgatar',
        description: 'Não foi possível processar o resgate.',
        variant: 'destructive',
      });
    }
  };

  return {
    clients,
    isLoading,
    addClient,
    updateClient,
    updateClientPoints,
    redeemPoints,
    refetch: fetchClients,
  };
}
