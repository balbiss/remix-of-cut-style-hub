import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Usar horário atual em UTC (Supabase armazena em UTC)
    // O navegador do cliente já converte para UTC ao usar toISOString()
    // Então a comparação está correta: comparamos UTC com UTC
    const now = new Date().toISOString();
    
    console.log(`[${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT] Verificando agendamentos expirados...`);
    console.log(`[UTC] ${now}`);

    // Buscar agendamentos pending_payment que expiraram (com dados do cliente para enviar mensagem)
    // A comparação é feita em UTC, que é como o Supabase armazena as datas
    console.log(`🔍 Buscando agendamentos expirados... (tolerance_expires_at < ${now})`);
    console.log(`🔍 Query: status='pending_payment' AND tolerance_expires_at IS NOT NULL AND tolerance_expires_at < '${now}'`);
    
    const { data: expiredAppointments, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('id, tenant_id, professional_id, data_hora, cliente_zap, cliente_nome, tolerance_expires_at')
      .eq('status', 'pending_payment')
      .not('tolerance_expires_at', 'is', null)
      .lt('tolerance_expires_at', now);

    if (fetchError) {
      console.error('❌ Erro ao buscar agendamentos expirados:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Total de agendamentos pending_payment expirados encontrados: ${expiredAppointments?.length || 0}`);
    
    if (expiredAppointments && expiredAppointments.length > 0) {
      expiredAppointments.forEach((apt, index) => {
        const expiresAtBRT = apt.tolerance_expires_at 
          ? new Date(apt.tolerance_expires_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
          : 'N/A';
        console.log(`  ${index + 1}. ID: ${apt.id}, Cliente: ${apt.cliente_nome || 'N/A'}, Zap: ${apt.cliente_zap || 'N/A'}, Expira: ${expiresAtBRT} BRT`);
      });
    }

    if (!expiredAppointments || expiredAppointments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum agendamento expirado encontrado',
          cancelled: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let cancelledCount = 0;
    let messagesSent = 0;

    console.log(`Encontrados ${expiredAppointments.length} agendamento(s) expirado(s) para processar`);

    // Processar cada agendamento expirado individualmente para enviar mensagens
    for (const appointment of expiredAppointments) {
      // Log para debug (mostrar horário de Brasília)
      const expiresAtBRT = appointment.tolerance_expires_at 
        ? new Date(appointment.tolerance_expires_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'N/A';
      console.log(`Processando agendamento ${appointment.id} - Expirou em: ${expiresAtBRT} BRT`);
      
      // Cancelar agendamento
      const { error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (updateError) {
        console.error(`❌ Erro ao cancelar agendamento ${appointment.id}:`, updateError);
        continue;
      }

      cancelledCount++;
      console.log(`✅ Agendamento ${appointment.id} cancelado (expirado)`);
      console.log(`📋 Dados do agendamento: cliente_zap=${appointment.cliente_zap || 'NULL'}, tenant_id=${appointment.tenant_id || 'NULL'}, cliente_nome=${appointment.cliente_nome || 'NULL'}`);

      // Enviar mensagem WhatsApp se tiver número do cliente
      console.log(`🔍 [DEBUG] Verificando condições para enviar mensagem...`);
      console.log(`🔍 [DEBUG] cliente_zap existe? ${!!appointment.cliente_zap}`);
      console.log(`🔍 [DEBUG] tenant_id existe? ${!!appointment.tenant_id}`);
      
      if (!appointment.cliente_zap) {
        console.log(`⚠️ [BLOQUEADO] Agendamento ${appointment.id} não tem número do cliente (cliente_zap), mensagem não enviada`);
      } else if (!appointment.tenant_id) {
        console.log(`⚠️ [BLOQUEADO] Agendamento ${appointment.id} não tem tenant_id, mensagem não enviada`);
      } else {
        console.log(`✅ [DEBUG] Condições básicas OK, iniciando processo de envio...`);
        try {
          console.log(`📱 [INICIANDO] Tentando enviar mensagem para cliente: ${appointment.cliente_zap}`);
          
          // Buscar conexão WhatsApp do tenant
          const { data: connection, error: connError } = await supabaseAdmin
            .from('connections')
            .select('*')
            .eq('tenant_id', appointment.tenant_id)
            .eq('status', 'online')
            .maybeSingle();

          if (connError) {
            console.error(`❌ Erro ao buscar conexão WhatsApp:`, connError);
          } else if (!connection) {
            console.log(`⚠️ WhatsApp não conectado para tenant ${appointment.tenant_id}, mensagem não enviada`);
          } else if (!connection.api_instance_token) {
            console.log(`⚠️ Conexão WhatsApp sem token para tenant ${appointment.tenant_id}, mensagem não enviada`);
          } else {
            console.log(`✅ Conexão WhatsApp encontrada: ${connection.instance_name}`);
            console.log(`🔑 Token disponível: ${connection.api_instance_token ? 'SIM' : 'NÃO'}`);
            console.log(`📱 Token (primeiros 10 caracteres): ${connection.api_instance_token ? connection.api_instance_token.substring(0, 10) + '...' : 'N/A'}`);
            
            // Buscar nome da barbearia
            const { data: tenant, error: tenantError } = await supabaseAdmin
              .from('tenants')
              .select('nome')
              .eq('id', appointment.tenant_id)
              .single();

            if (tenantError) {
              console.error(`❌ Erro ao buscar nome da barbearia:`, tenantError);
            } else {
              console.log(`🏪 Nome da barbearia: ${tenant?.nome || 'Barbearia'}`);
            }

            const barbershopName = tenant?.nome || 'Barbearia';
            const clienteNome = appointment.cliente_nome || 'Cliente';
            console.log(`👤 Nome do cliente: ${clienteNome}`);

            const message = `*${barbershopName}*\n\n` +
              `Olá ${clienteNome}! 👋\n\n` +
              `O tempo para realizar o pagamento PIX do seu agendamento *expirou* (15 minutos).\n\n` +
              `O horário foi liberado e você pode criar um novo agendamento quando quiser.\n\n` +
              `Obrigado pela preferência! 🙏`;

            // Enviar mensagem via WUZAPI
            const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL') || 'https://weeb.inoovaweb.com.br';
            console.log(`🌐 URL da API WhatsApp: ${whatsappApiUrl}`);
            console.log(`🔍 Variável de ambiente WHATSAPP_API_URL: ${Deno.env.get('WHATSAPP_API_URL') || 'NÃO DEFINIDA (usando padrão)'}`);
            
            let cleanPhone = appointment.cliente_zap.replace(/\D/g, ''); // Remove caracteres não numéricos
            
            // Adicionar código do país (55) se o número não começar com 55
            // Números brasileiros geralmente têm 11 dígitos (DDD + número)
            // Se tiver 11 dígitos e não começar com 55, adicionar 55
            if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) {
              cleanPhone = '55' + cleanPhone;
              console.log(`📞 Número formatado com código do país: ${cleanPhone}`);
            } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) {
              // Número sem DDD (10 dígitos) - adicionar código do país + DDD padrão
              // Isso é menos comum, mas pode acontecer
              cleanPhone = '5511' + cleanPhone; // Assumindo DDD 11 (São Paulo)
              console.log(`📞 Número formatado com código do país e DDD padrão: ${cleanPhone}`);
            }
            
            console.log(`📞 Número original: ${appointment.cliente_zap}, Número limpo: ${cleanPhone}`);
            let shouldSendMessage = true; // Flag para controlar se deve enviar
            
            // PRIMEIRO: Verificar se o número tem WhatsApp (obrigatório)
            console.log(`🔍 Verificando número ${cleanPhone} antes de enviar mensagem...`);
            
            try {
              const checkResponse = await fetch(`${whatsappApiUrl}/user/check`, {
                method: 'POST',
                headers: {
                  'Token': connection.api_instance_token,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  Phone: [cleanPhone], // Array conforme documentação
                }),
              });

              const checkResponseText = await checkResponse.text();
              console.log(`🔍 Resposta da verificação: Status ${checkResponse.status}, Body: ${checkResponseText}`);

              if (checkResponse.ok) {
                try {
                  const checkData = JSON.parse(checkResponseText);
                  
                  // Verificar se o número tem WhatsApp
                  const user = checkData?.data?.Users?.[0];
                  if (user && user.IsInWhatsapp) {
                    // Usar o JID formatado se disponível, ou o número limpo
                    if (user.JID) {
                      cleanPhone = user.JID.replace('@s.whatsapp.net', '');
                      console.log(`✅ Número verificado e formatado: ${cleanPhone}`);
                    } else {
                      console.log(`✅ Número verificado: ${cleanPhone}`);
                    }
                  } else {
                    console.error(`❌ Número ${cleanPhone} não possui WhatsApp (IsInWhatsapp: ${user?.IsInWhatsapp})`);
                    console.log(`⚠️ Mensagem não será enviada para número sem WhatsApp`);
                    shouldSendMessage = false; // Não enviar mensagem
                  }
                } catch (parseError) {
                  console.error(`❌ Erro ao parsear resposta da verificação:`, parseError);
                  // Continuar mesmo assim, tentar enviar
                }
              } else {
                console.error(`❌ Erro ao verificar número: Status ${checkResponse.status}, Response: ${checkResponseText}`);
                // Continuar mesmo assim, tentar enviar
              }
            } catch (checkError) {
              console.error(`❌ Erro ao verificar número antes de enviar:`, checkError);
              // Continuar mesmo assim, tentar enviar
            }
            
            // SEGUNDO: Enviar mensagem (apenas se o número tem WhatsApp)
            if (shouldSendMessage) {
              console.log(`📤 [ENVIANDO MENSAGEM] Iniciando envio para ${cleanPhone} via ${whatsappApiUrl}/chat/send/text`);
              console.log(`📝 [ENVIANDO MENSAGEM] Conteúdo: ${message.substring(0, 100)}...`);
              
              try {
                const response = await fetch(`${whatsappApiUrl}/chat/send/text`, {
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

                const responseText = await response.text();
                console.log(`📥 [ENVIANDO MENSAGEM] Resposta da API WhatsApp: Status ${response.status}, Body: ${responseText}`);

                if (response.ok) {
                  try {
                    const responseData = JSON.parse(responseText);
                    if (responseData.success !== false) {
                      messagesSent++;
                      console.log(`✅ [SUCESSO] Mensagem de expiração enviada com sucesso para ${cleanPhone}`);
                    } else {
                      console.error(`❌ [ERRO] API retornou success: false para ${cleanPhone}:`, JSON.stringify(responseData));
                    }
                  } catch (parseError) {
                    // Se não for JSON, mas status é OK, considerar sucesso
                    messagesSent++;
                    console.log(`✅ [SUCESSO] Mensagem de expiração enviada para ${cleanPhone} (resposta não-JSON)`);
                  }
                } else {
                  console.error(`❌ [ERRO] Falha ao enviar mensagem para ${cleanPhone}: Status ${response.status}, Response: ${responseText}`);
                }
              } catch (sendError) {
                console.error(`❌ [ERRO] Exceção ao enviar mensagem para ${cleanPhone}:`, sendError);
                if (sendError instanceof Error) {
                  console.error(`❌ [ERRO] Stack trace:`, sendError.stack);
                }
              }
            } else {
              console.log(`⚠️ [CANCELADO] Mensagem não enviada para ${cleanPhone} (número não possui WhatsApp ou erro na verificação)`);
              console.log(`⚠️ [CANCELADO] shouldSendMessage = ${shouldSendMessage}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao enviar mensagem de expiração para agendamento ${appointment.id}:`, error);
          if (error instanceof Error) {
            console.error(`❌ Stack trace:`, error.stack);
          }
        }
      }
    }

    console.log(`\n📊 RESUMO FINAL:`);
    console.log(`   ✅ ${cancelledCount} agendamento(s) expirado(s) cancelado(s)`);
    console.log(`   📤 ${messagesSent} mensagem(ns) enviada(s)`);
    if (cancelledCount > messagesSent) {
      console.log(`   ⚠️ ${cancelledCount - messagesSent} mensagem(ns) não enviada(s) (verificar logs acima para detalhes)`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${cancelledCount} agendamento(s) expirado(s) cancelado(s), ${messagesSent} mensagem(ns) enviada(s)`,
        cancelled: cancelledCount,
        messages_sent: messagesSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in cancel-expired-appointments:', errorMessage);
    
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

