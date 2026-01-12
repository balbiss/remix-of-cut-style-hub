// Script para testar a Edge Function de cancelamento de agendamentos expirados
// Execute este script no terminal: node testar-cancelamento.js

const SUPABASE_URL = 'https://itrxoadmfbynnxokigha.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA';

async function testarCancelamento() {
  console.log('🧪 Testando Edge Function de cancelamento...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cancel-expired-appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log('📊 Resultado:', JSON.stringify(data, null, 2));
      console.log(`\n✅ ${data.cancelled || 0} agendamento(s) cancelado(s)`);
      console.log(`📱 ${data.messages_sent || 0} mensagem(ns) enviada(s)`);
    } else {
      console.error('❌ Erro:', data);
    }
  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
  }
}

testarCancelamento();

