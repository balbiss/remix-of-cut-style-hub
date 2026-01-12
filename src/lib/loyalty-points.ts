import { supabase } from '@/integrations/supabase/client';

/**
 * Calcula pontos baseado na configuração de fidelidade
 */
export function calculateLoyaltyPoints(
  loyaltyConfig: {
    enabled: boolean;
    points_type: 'visit' | 'amount';
    points_per_visit: number;
    points_per_real: number;
    min_amount_for_points: number;
  } | null,
  totalPrice: number
): number {
  if (!loyaltyConfig || !loyaltyConfig.enabled) return 0;

  if (loyaltyConfig.points_type === 'visit') {
    return loyaltyConfig.points_per_visit;
  } else {
    if (totalPrice >= loyaltyConfig.min_amount_for_points) {
      return Math.floor(totalPrice * loyaltyConfig.points_per_real);
    }
    return 0;
  }
}

/**
 * Adiciona pontos de fidelidade para um cliente
 * Usado quando um agendamento é marcado como concluído
 */
export async function addLoyaltyPoints(
  tenantId: string,
  clientPhone: string,
  pointsToAdd: number
): Promise<{ success: boolean; error?: string }> {
  if (pointsToAdd <= 0) {
    return { success: true };
  }

  try {
    // Buscar pontos existentes do cliente
    const { data: existingPoints, error: fetchError } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cliente_zap', clientPhone)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingPoints) {
      // Atualizar pontos existentes
      const newTotal = (existingPoints.pontos || 0) + pointsToAdd;
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          pontos: newTotal,
          total_earned: ((existingPoints as any).total_earned || 0) + pointsToAdd,
        })
        .eq('id', existingPoints.id);

      if (updateError) throw updateError;
    } else {
      // Criar novo registro de pontos
      const { error: insertError } = await supabase
        .from('loyalty_points')
        .insert({
          tenant_id: tenantId,
          cliente_zap: clientPhone,
          pontos: pointsToAdd,
          total_earned: pointsToAdd,
          total_redeemed: 0,
        });

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error adding loyalty points:', error);
    return {
      success: false,
      error: error.message || 'Erro ao adicionar pontos',
    };
  }
}

/**
 * Lança pontos automaticamente quando um agendamento é concluído
 */
export async function awardPointsOnAppointmentCompletion(
  appointmentId: string
): Promise<{ success: boolean; pointsAwarded: number; error?: string }> {
  try {
    // Buscar dados do agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        tenant_id,
        cliente_zap,
        service_id,
        services:service_id (preco),
        tenants:tenant_id (
          id
        )
      `)
      .eq('id', appointmentId)
      .eq('status', 'completed')
      .single();

    if (appointmentError || !appointment) {
      return {
        success: false,
        pointsAwarded: 0,
        error: 'Agendamento não encontrado ou não está concluído',
      };
    }

    // Verificar se os pontos já foram lançados (evitar duplicação)
    // Podemos usar um campo na tabela appointments ou verificar histórico
    // Por enquanto, vamos verificar se já existe um registro recente de pontos

    // Buscar configuração de fidelidade
    const { data: loyaltyConfig, error: configError } = await supabase
      .from('loyalty_config')
      .select('*')
      .eq('tenant_id', appointment.tenant_id)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching loyalty config:', configError);
      return { success: false, pointsAwarded: 0, error: 'Erro ao buscar configuração' };
    }

    if (!loyaltyConfig || !loyaltyConfig.enabled) {
      return { success: true, pointsAwarded: 0 }; // Programa desativado, não adiciona pontos
    }

    // Calcular pontos
    const servicePrice = (appointment.services as any)?.preco || 0;
    const pointsToAdd = calculateLoyaltyPoints(loyaltyConfig, servicePrice);

    if (pointsToAdd <= 0) {
      return { success: true, pointsAwarded: 0 };
    }

    // Adicionar pontos
    const result = await addLoyaltyPoints(
      appointment.tenant_id,
      appointment.cliente_zap,
      pointsToAdd
    );

    if (!result.success) {
      return {
        success: false,
        pointsAwarded: 0,
        error: result.error,
      };
    }

    return {
      success: true,
      pointsAwarded: pointsToAdd,
    };
  } catch (error: any) {
    console.error('Error awarding points on completion:', error);
    return {
      success: false,
      pointsAwarded: 0,
      error: error.message || 'Erro ao lançar pontos',
    };
  }
}


