import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PixPaymentRequest {
  amount: number;
  description: string;
  payer_email?: string;
  payer_name?: string;
  external_reference?: string;
  tenant_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log para debug
    console.log('📥 Request recebida:', {
      method: req.method,
      url: req.url,
      hasAuth: !!req.headers.get('Authorization'),
      hasApikey: !!req.headers.get('apikey'),
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
    let body: PixPaymentRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new Error('Invalid JSON in request body');
    }
    const { amount, description, payer_email, payer_name, external_reference, tenant_id } = body;

    // Validate required fields
    if (!amount || !description || !tenant_id) {
      throw new Error('Missing required fields: amount, description, tenant_id');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    console.log(`Creating PIX payment for tenant: ${tenant_id}, amount: ${amount}`);

    // Buscar informações do tenant, incluindo Access Token do Mercado Pago
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, nome, mp_access_token, mp_public_key')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // Verificar se o tenant tem Access Token configurado
    // O Access Token é necessário para criar pagamentos (não a Public Key)
    const accessToken = tenant.mp_access_token || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      throw new Error('Mercado Pago Access Token not configured. Please configure it in tenant settings or environment variables.');
    }

    // Gerar Idempotency Key único para evitar pagamentos duplicados
    const idempotencyKey = external_reference || `pix_${tenant_id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Criar pagamento PIX via API do Mercado Pago
    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description.substring(0, 600), // Limite de 600 caracteres
        payment_method_id: 'pix',
        payer: {
          email: payer_email || 'customer@example.com',
          first_name: payer_name?.split(' ')[0] || 'Cliente',
          last_name: payer_name?.split(' ').slice(1).join(' ') || '',
        },
        external_reference: external_reference || `appointment_${Date.now()}`,
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`,
      }),
    });

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
    console.log('Payment created:', paymentData.id);

    // Extrair QR Code do pagamento
    const qrCode = 
      paymentData.point_of_interaction?.transaction_data?.qr_code ||
      paymentData.point_of_interaction?.transaction_data?.qr_code_base64 ||
      null;

    const qrCodeBase64 = 
      paymentData.point_of_interaction?.transaction_data?.qr_code_base64 ||
      paymentData.point_of_interaction?.transaction_data?.qr_code ||
      null;

    // Retornar resposta formatada
    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: paymentData.id,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          transaction_amount: paymentData.transaction_amount,
          date_created: paymentData.date_created,
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          point_of_interaction: paymentData.point_of_interaction,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in create-pix-payment:', errorMessage);
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

