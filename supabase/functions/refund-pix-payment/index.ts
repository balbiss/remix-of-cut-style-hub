import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  payment_id: string;
  appointment_id: string;
  tenant_id: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se temos apikey
    const apikey = req.headers.get('apikey');
    if (!apikey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing apikey header',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body
    let body: RefundRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new Error('Invalid JSON in request body');
    }

    const { payment_id, appointment_id, tenant_id, reason } = body;

    // Validate required fields
    if (!payment_id || !appointment_id || !tenant_id) {
      throw new Error('Missing required fields: payment_id, appointment_id, tenant_id');
    }

    console.log(`Processing refund for payment: ${payment_id}, appointment: ${appointment_id}`);

    // Buscar informações do tenant, incluindo Access Token do Mercado Pago
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, nome, mp_access_token')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // Verificar se o tenant tem Access Token configurado
    const accessToken = tenant.mp_access_token;
    if (!accessToken) {
      throw new Error('Mercado Pago Access Token não configurado para este tenant');
    }

    // Buscar dados do agendamento
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('id, pix_payment_id, prepaid_amount, refunded, status')
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    // Verificar se já foi estornado
    if (appointment.refunded) {
      throw new Error('Este pagamento já foi estornado');
    }

    // Verificar se o payment_id corresponde
    if (appointment.pix_payment_id !== payment_id) {
      throw new Error('Payment ID não corresponde ao agendamento');
    }

    // Fazer estorno no Mercado Pago
    const refundAmount = appointment.prepaid_amount || 0;
    
    console.log(`Refunding ${refundAmount} for payment ${payment_id}`);

    const refundResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment_id}/refunds`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `refund-${payment_id}-${Date.now()}`,
        },
        body: JSON.stringify({
          amount: refundAmount,
        }),
      }
    );

    const refundData = await refundResponse.json();

    if (!refundResponse.ok) {
      console.error('Mercado Pago refund error:', refundData);
      throw new Error(
        refundData.message || 
        refundData.error || 
        `Erro ao processar estorno: ${refundResponse.status}`
      );
    }

    console.log('Refund successful:', refundData);

    // Atualizar agendamento com informações de estorno
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({
        refunded: true,
        refunded_at: new Date().toISOString(),
        refund_amount: refundAmount,
        refund_reason: reason || 'Estorno solicitado pelo administrador',
        status: 'cancelled',
      })
      .eq('id', appointment_id);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      throw new Error('Erro ao atualizar agendamento após estorno');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Estorno processado com sucesso',
        refund: {
          id: refundData.id,
          amount: refundAmount,
          status: refundData.status,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in refund-pix-payment:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});






