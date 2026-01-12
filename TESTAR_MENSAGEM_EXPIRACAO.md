# 🧪 Como Testar o Envio de Mensagem de Expiração

## Problema
A mensagem de expiração não está sendo enviada quando o agendamento expira após 15 minutos.

## Passos para Testar

### 1. Verificar se a Edge Function está sendo executada

No Supabase Dashboard:
- Vá em **Edge Functions > cancel-expired-appointments > Logs**
- Procure por logs recentes (últimos 5 minutos)
- Deve aparecer: `[BRT] Verificando agendamentos expirados...`

### 2. Verificar se encontra agendamentos expirados

Nos logs, procure por:
- `📊 Total de agendamentos pending_payment expirados encontrados: X`
- Se `X = 0`, não há agendamentos expirados no momento

### 3. Verificar se está tentando enviar mensagem

Nos logs, procure por:
- `📱 Tentando enviar mensagem para cliente: (11) 98438-8245`
- `✅ Conexão WhatsApp encontrada: Barbearia_Balbis`
- `📞 Número original: (11) 98438-8245, Número limpo: 5511984388245`
- `🔍 Verificando número 5511984388245 antes de enviar mensagem...`
- `📤 [ENVIANDO MENSAGEM] Iniciando envio para 5511984388245...`

### 4. Verificar se a mensagem foi enviada com sucesso

Nos logs, procure por:
- `✅ [SUCESSO] Mensagem de expiração enviada com sucesso para 5511984388245`
- `📊 RESUMO FINAL:`
  - `✅ X agendamento(s) expirado(s) cancelado(s)`
  - `📤 Y mensagem(ns) enviada(s)`

### 5. Se não aparecer `📤 [ENVIANDO MENSAGEM]`, verificar:

- `⚠️ WhatsApp não conectado para tenant...` → WhatsApp não está online
- `⚠️ Conexão WhatsApp sem token...` → Token não está configurado
- `⚠️ [CANCELADO] Mensagem não enviada...` → Número não tem WhatsApp ou erro na verificação
- `❌ Erro ao buscar conexão WhatsApp...` → Erro ao buscar conexão no banco

## Teste Manual

### Opção 1: Expirar um agendamento manualmente

Execute este SQL para expirar um agendamento de teste:

```sql
-- Expirar um agendamento pending_payment manualmente
UPDATE public.appointments
SET tolerance_expires_at = NOW() - INTERVAL '1 minute'
WHERE id IN (
  SELECT id 
  FROM public.appointments
  WHERE status = 'pending_payment'
    AND tolerance_expires_at > NOW()
  LIMIT 1
);
```

Depois, chame a Edge Function manualmente:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA" \
  -H "Content-Type: application/json"
```

### Opção 2: Usar o script de teste

Execute:
```bash
node TESTAR_ENVIO_MENSAGEM_EXPIRACAO.js
```

Isso simula o que a Edge Function faz e mostra onde está o problema.

## Verificar Variável de Ambiente

A Edge Function precisa da variável `WHATSAPP_API_URL`:

1. No Supabase Dashboard, vá em **Edge Functions > cancel-expired-appointments > Settings**
2. Procure por **Environment Variables** ou **Secrets**
3. Adicione: `WHATSAPP_API_URL` = `https://weeb.inoovaweb.com.br`

## Verificar Cron Job

Verifique se o cron job está ativo:

```sql
SELECT * FROM cron.job WHERE jobname = 'cancel-expired-appointments';
```

Deve retornar:
- `active = true`
- `schedule = '*/2 * * * *'` (a cada 2 minutos)

