// ============================================================
// CHAMAR EDGE FUNCTION MANUALMENTE PARA TESTAR
// Execute: node CHAMAR_EDGE_FUNCTION_MANUAL.js
// ============================================================

const SUPABASE_URL = 'https://itrxoadmfbynnxokigha.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA';

async function chamarEdgeFunction() {
  try {
    console.log('🔄 Chamando Edge Function cancel-expired-appointments...\n');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cancel-expired-appointments`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('📥 Resposta da Edge Function:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Body: ${responseText}\n`);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Edge Function executada com sucesso!');
        console.log(`   Agendamentos cancelados: ${data.cancelled || 0}`);
        console.log(`   Mensagens enviadas: ${data.messages_sent || 0}`);
        
        if (data.cancelled > 0 && data.messages_sent === 0) {
          console.log('\n⚠️ ATENÇÃO: Agendamentos foram cancelados, mas nenhuma mensagem foi enviada!');
          console.log('   Verifique os logs da Edge Function no Supabase Dashboard para ver o motivo.');
        }
      } catch (parseError) {
        console.log('✅ Edge Function executada (resposta não-JSON)');
      }
    } else {
      console.error('❌ Erro ao chamar Edge Function:', responseText);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

chamarEdgeFunction();

