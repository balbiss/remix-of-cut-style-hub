// ============================================================
// TESTAR ENVIO DE MENSAGEM DE EXPIRAÇÃO MANUALMENTE
// Execute: node TESTAR_ENVIO_MENSAGEM_EXPIRACAO.js
// ============================================================

const SUPABASE_URL = 'https://itrxoadmfbynnxokigha.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcyNTEwNiwiZXhwIjoyMDc5MzAxMTA2fQ.FSGQW3U9Rq8ZOkqi21Ofm1-T2nxRbYN5Ic9Nx2inQXA';
const WHATSAPP_API_URL = 'https://weeb.inoovaweb.com.br';

async function testarEnvioMensagem() {
  try {
    console.log('🔍 Buscando conexão WhatsApp...');
    
    // Buscar conexão WhatsApp
    const connectionResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/connections?tenant_id=eq.d35f0122-eaa9-4382-882a-5dfa30bceda7&status=eq.online&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const connections = await connectionResponse.json();
    console.log('📋 Conexões encontradas:', connections);

    if (!connections || connections.length === 0) {
      console.error('❌ Nenhuma conexão WhatsApp online encontrada');
      return;
    }

    const connection = connections[0];
    console.log('✅ Conexão encontrada:', {
      instance_name: connection.instance_name,
      tem_token: !!connection.api_instance_token,
      token_preview: connection.api_instance_token ? connection.api_instance_token.substring(0, 10) + '...' : 'N/A',
    });

    // Buscar nome da barbearia
    const tenantResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tenants?id=eq.d35f0122-eaa9-4382-882a-5dfa30bceda7&select=nome`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const tenants = await tenantResponse.json();
    const barbershopName = tenants?.[0]?.nome || 'Barbearia';
    console.log('🏪 Nome da barbearia:', barbershopName);

    // Número do cliente: "(11) 98438-8245"
    const clienteZap = '(11) 98438-8245';
    let cleanPhone = clienteZap.replace(/\D/g, '');
    
    // Adicionar código do país se necessário
    if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    console.log('📞 Número original:', clienteZap);
    console.log('📞 Número limpo:', cleanPhone);

    // PRIMEIRO: Verificar se o número tem WhatsApp
    console.log('\n🔍 Verificando número no WhatsApp...');
    const checkResponse = await fetch(`${WHATSAPP_API_URL}/user/check`, {
      method: 'POST',
      headers: {
        'Token': connection.api_instance_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Phone: [cleanPhone],
      }),
    });

    const checkResponseText = await checkResponse.text();
    console.log('📥 Resposta da verificação:', {
      status: checkResponse.status,
      statusText: checkResponse.statusText,
      body: checkResponseText,
    });

    if (!checkResponse.ok) {
      console.error('❌ Erro ao verificar número:', checkResponseText);
      return;
    }

    const checkData = JSON.parse(checkResponseText);
    const user = checkData?.data?.Users?.[0];
    
    if (!user || !user.IsInWhatsapp) {
      console.error('❌ Número não possui WhatsApp:', {
        IsInWhatsapp: user?.IsInWhatsapp,
        JID: user?.JID,
      });
      return;
    }

    console.log('✅ Número verificado e tem WhatsApp:', {
      IsInWhatsapp: user.IsInWhatsapp,
      JID: user.JID,
    });

    // Usar JID formatado se disponível
    if (user.JID) {
      cleanPhone = user.JID.replace('@s.whatsapp.net', '');
      console.log('📞 Número formatado (JID):', cleanPhone);
    }

    // SEGUNDO: Enviar mensagem
    console.log('\n📤 Enviando mensagem...');
    const message = `*${barbershopName}*\n\n` +
      `Olá Balbis Balbis! 👋\n\n` +
      `O tempo para realizar o pagamento PIX do seu agendamento *expirou* (15 minutos).\n\n` +
      `O horário foi liberado e você pode criar um novo agendamento quando quiser.\n\n` +
      `Obrigado pela preferência! 🙏`;

    console.log('📝 Mensagem:', message);

    const sendResponse = await fetch(`${WHATSAPP_API_URL}/chat/send/text`, {
      method: 'POST',
      headers: {
        'token': connection.api_instance_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Phone: cleanPhone,
        Body: message,
      }),
    });

    const sendResponseText = await sendResponse.text();
    console.log('\n📥 Resposta do envio:', {
      status: sendResponse.status,
      statusText: sendResponse.statusText,
      body: sendResponseText,
    });

    if (sendResponse.ok) {
      try {
        const sendData = JSON.parse(sendResponseText);
        if (sendData.success !== false) {
          console.log('✅ Mensagem enviada com sucesso!');
        } else {
          console.error('❌ API retornou success: false:', sendData);
        }
      } catch (parseError) {
        console.log('✅ Mensagem enviada (resposta não-JSON)');
      }
    } else {
      console.error('❌ Erro ao enviar mensagem:', sendResponseText);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testarEnvioMensagem();






