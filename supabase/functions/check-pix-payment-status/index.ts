import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckPaymentRequest {
  payment_id: string;
  tenant_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se temos apikey (não Authorization, pois verify_jwt = false)
    const apikey = req.headers.get('apikey');
    if (!apikey) {
      console.error('❌ Missing apikey header');
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
    
    // Log para debug
    console.log('📥 Request recebida:', {
      method: req.method,
      url: req.url,
      hasApikey: !!apikey,
    });

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
    let body: CheckPaymentRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new Error('Invalid JSON in request body');
    }
    const { payment_id, tenant_id } = body;

    // Validate required fields
    if (!payment_id || !tenant_id) {
      throw new Error('Missing required fields: payment_id, tenant_id');
    }

    console.log(`Checking PIX payment status for payment: ${payment_id}, tenant: ${tenant_id}`);

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
    const accessToken = tenant.mp_access_token || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      throw new Error('Mercado Pago Access Token not configured');
    }

    // Verificar status do pagamento via API do Mercado Pago
    const mercadoPagoResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!mercadoPagoResponse.ok) {
      const errorData = await mercadoPagoResponse.json().catch(() => ({}));
      console.error('Mercado Pago API error:', errorData);
      throw new Error(
        errorData.message || 
        errorData.error || 
        `Mercado Pago API error: ${mercadoPagoResponse.status}`
      );
    }

    const paymentData = await mercadoPagoResponse.json();
    console.log('Payment status:', paymentData.status);

    // Retornar resposta formatada
    return new Response(
      JSON.stringify({
        success: true,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount,
        date_approved: paymentData.date_approved,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error in check-pix-payment-status:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

