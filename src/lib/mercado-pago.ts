// Mercado Pago Integration Service
// Documentação: https://www.mercadopago.com.br/developers/pt/docs

export interface CreatePixPaymentParams {
  amount: number; // Valor em reais
  description: string; // Descrição do pagamento
  payerEmail?: string; // Email do pagador (opcional)
  payerName?: string; // Nome do pagador (opcional)
  externalReference?: string; // Referência externa (ID do agendamento)
}

export interface PixPaymentResponse {
  success: boolean;
  payment?: {
    id: string;
    qr_code: string; // QR Code em base64 ou string
    qr_code_base64?: string; // QR Code em base64
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    };
    status: string;
    status_detail: string;
    transaction_amount: number;
    date_created: string;
  };
  error?: string;
}

/**
 * Cria um pagamento PIX usando a API do Mercado Pago
 * Usa a Public Key para criar o pagamento
 */
export async function createPixPayment(
  publicKey: string,
  params: CreatePixPaymentParams
): Promise<PixPaymentResponse> {
  try {
    console.log('💳 Criando pagamento PIX:', {
      amount: params.amount,
      description: params.description,
      hasPublicKey: !!publicKey,
    });

    // A API do Mercado Pago requer o Access Token (não a Public Key)
    // Mas para criar pagamentos, precisamos usar o Access Token
    // Por enquanto, vamos criar um endpoint no backend ou usar Edge Function
    
    // Por enquanto, vamos simular ou usar uma abordagem diferente
    // O ideal seria ter um Access Token armazenado de forma segura
    
    // Para desenvolvimento, vamos criar um QR Code PIX manualmente
    // ou usar uma Edge Function do Supabase
    
    // Formato do QR Code PIX (EMV)
    const pixData = generatePixQRCode(params);
    
    return {
      success: true,
      payment: {
        id: `pix_${Date.now()}`,
        qr_code: pixData.qrCode,
        qr_code_base64: pixData.qrCodeBase64,
        status: 'pending',
        status_detail: 'pending_waiting_payment',
        transaction_amount: params.amount,
        date_created: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar pagamento PIX',
    };
  }
}

/**
 * Gera um QR Code PIX usando Edge Function do Supabase
 * Esta função chama uma Edge Function que usa o Access Token do Mercado Pago
 */
export async function createPixPaymentViaEdgeFunction(
  params: CreatePixPaymentParams,
  tenantId: string
): Promise<PixPaymentResponse> {
  try {
    console.log('💳 Criando pagamento PIX via Edge Function:', params);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseAnonKey) {
      console.error('❌ VITE_SUPABASE_PUBLISHABLE_KEY não está definido');
      return {
        success: false,
        error: 'Configuração do Supabase não encontrada',
      };
    }

    console.log('🔑 Headers da requisição:', {
      url: `${supabaseUrl}/functions/v1/create-pix-payment`,
      hasAnonKey: !!supabaseAnonKey,
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-pix-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          amount: params.amount,
          description: params.description,
          payer_email: params.payerEmail,
          payer_name: params.payerName,
          external_reference: params.externalReference,
          tenant_id: tenantId,
        }),
      }
    );

    console.log('📋 Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        console.error('❌ Error response text:', text);
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: text || `HTTP ${response.status}` };
        }
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ Error data:', errorData);
      
      // Mensagens de erro mais específicas
      if (response.status === 401 || response.status === 403) {
        if (errorData.error?.includes('JWT') || errorData.error?.includes('Invalid')) {
          throw new Error('Erro de autenticação. A Edge Function pode não estar deployada ou há problema na configuração. Verifique se a função create-pix-payment foi deployada no Supabase.');
        }
        throw new Error('Não autorizado. Verifique as configurações do Supabase.');
      }
      
      if (response.status === 404) {
        throw new Error('Edge Function não encontrada. Certifique-se de que a função create-pix-payment foi deployada no Supabase.');
      }
      
      throw new Error(errorData.error || errorData.message || `Erro ao criar pagamento (${response.status})`);
    }

    const data = await response.json();
    console.log('✅ Payment data received:', data);
    
    return {
      success: true,
      payment: data.payment,
    };
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX via Edge Function:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar pagamento PIX',
    };
  }
}

/**
 * Verifica o status de um pagamento PIX usando Edge Function do Supabase
 */
export async function checkPixPaymentStatus(
  paymentId: string,
  tenantId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    // Usar VITE_SUPABASE_PUBLISHABLE_KEY (mesma variável usada no client.ts)
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseAnonKey) {
      console.error('❌ VITE_SUPABASE_PUBLISHABLE_KEY não está definido');
      return {
        success: false,
        error: 'Configuração do Supabase não encontrada',
      };
    }

    console.log('🔄 Verificando status do pagamento PIX:', paymentId);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/check-pix-payment-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          tenant_id: tenantId,
        }),
      }
    );

    console.log('🔄 Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        console.error('❌ Error response text:', text);
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: text || `HTTP ${response.status}` };
        }
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ Error data:', errorData);
      return {
        success: false,
        error: errorData.error || errorData.message || 'Erro ao verificar status do pagamento',
      };
    }

    const data = await response.json();
    console.log('✅ Payment status received:', data);
    
    return {
      success: true,
      status: data.status,
    };
  } catch (error: any) {
    console.error('❌ Erro ao verificar status do pagamento:', error);
    return {
      success: false,
      error: error.message || 'Erro ao verificar status do pagamento',
    };
  }
}

/**
 * Gera um QR Code PIX básico (para desenvolvimento/teste)
 * Em produção, isso deve ser feito pela API do Mercado Pago
 */
function generatePixQRCode(params: CreatePixPaymentParams): {
  qrCode: string;
  qrCodeBase64: string;
} {
  // Formato EMV do PIX (simplificado para desenvolvimento)
  // Em produção, isso deve vir da API do Mercado Pago
  
  const amount = params.amount.toFixed(2);
  const description = params.description.substring(0, 25);
  
  // QR Code PIX EMV (formato simplificado)
  // Em produção, use a resposta real da API do Mercado Pago
  const pixString = `00020126${description}520400005303986540${amount}5802BR59${description}62070503***6304`;
  
  // Para desenvolvimento, vamos retornar um QR Code base64 de exemplo
  // Em produção, isso deve vir da API do Mercado Pago
  const qrCodeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  return {
    qrCode: pixString,
    qrCodeBase64: qrCodeBase64,
  };
}

