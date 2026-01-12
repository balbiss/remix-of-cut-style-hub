# 🧪 Como Testar o Cancelamento Manualmente

Para verificar se a Edge Function está funcionando e enviando mensagens:

## 1️⃣ Criar um Agendamento de Teste Expirado

Execute este SQL no Supabase para criar um agendamento `pending_payment` que já expirou:

```sql
-- Criar agendamento de teste expirado (expirou há 1 minuto)
INSERT INTO public.appointments (
  tenant_id,
  professional_id,
  service_id,
  data_hora,
  cliente_nome,
  cliente_zap,
  status,
  payment_method,
  prepaid_amount,
  tolerance_expires_at,
  pix_payment_id
)
SELECT 
  (SELECT id FROM public.tenants LIMIT 1), -- Primeiro tenant
  (SELECT id FROM public.professionals LIMIT 1), -- Primeiro profissional
  (SELECT id FROM public.services LIMIT 1), -- Primeiro serviço
  NOW() + INTERVAL '1 day', -- Agendamento para amanhã
  'Cliente Teste',
  '559182935558', -- Número do cliente (ajuste se necessário)
  'pending_payment',
  'online',
  15.00,
  NOW() - INTERVAL '1 minute', -- Expirou há 1 minuto
  'test-payment-id-123'
WHERE NOT EXISTS (
  SELECT 1 FROM public.appointments 
  WHERE pix_payment_id = 'test-payment-id-123'
)
ON CONFLICT DO NOTHING;
```

## 2️⃣ Chamar a Edge Function Manualmente

Execute no terminal:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA"
```

## 3️⃣ Verificar os Logs

1. Acesse: https://supabase.com/dashboard
2. Vá em **Edge Functions** > **cancel-expired-appointments** > **Logs**
3. Veja os logs detalhados que adicionei:
   - `🔍 Buscando agendamentos expirados...`
   - `📊 Total de agendamentos encontrados`
   - `📱 Tentando enviar mensagem para cliente`
   - `✅ Mensagem de expiração enviada` ou `❌ Erro ao enviar`

## 4️⃣ Verificar se o Agendamento Foi Cancelado

```sql
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  status,
  tolerance_expires_at,
  updated_at
FROM public.appointments
WHERE pix_payment_id = 'test-payment-id-123';
```

O `status` deve ser `'cancelled'` após a execução.

## 5️⃣ Verificar se a Mensagem Foi Enviada

- Verifique os logs da Edge Function
- Verifique se o WhatsApp recebeu a mensagem
- Veja o contador `messages_sent` na resposta da API

---

## 🔍 Possíveis Problemas

### Se não encontrar agendamentos:
- Verifique se o status é `'pending_payment'` (não `'pending'`)
- Verifique se `tolerance_expires_at` não é NULL
- Verifique se `tolerance_expires_at < NOW()`

### Se não enviar mensagem:
- Verifique se `cliente_zap` está preenchido
- Verifique se o WhatsApp está conectado (`status = 'online'`)
- Verifique os logs para ver o erro específico

### Se o cron job não executar:
- Verifique se o cron job está ativo: `SELECT * FROM cron.job WHERE jobname = 'cancel-expired-appointments';`
- Verifique os logs do cron: `SELECT * FROM cron.job_run_details WHERE jobid = 1 ORDER BY start_time DESC LIMIT 10;`

