# ✅ Verificação Completa - Sistema de Reserva Temporária

Agora que o constraint foi atualizado, vamos verificar se tudo está funcionando:

## 1️⃣ Verificar se o Agendamento Temporário Está Sendo Criado

### Teste:
1. Crie um novo agendamento com PIX
2. Abra o console do navegador (F12)
3. Procure por: `✅ Reserva temporária criada:`

**Se aparecer:**
- ✅ Agendamento temporário foi criado com sucesso
- Verifique se tem `id`, `dataHora`, `expiresAt`

**Se não aparecer ou der erro:**
- ❌ Verifique o erro no console
- Execute a migration `EXECUTAR_MIGRATION_PENDING_PAYMENT.sql` novamente

---

## 2️⃣ Verificar se o Horário Está Sendo Bloqueado

### Teste:
1. Crie um agendamento com PIX para um horário (ex: 27/12 às 09:00)
2. **SEM FECHAR O NAVEGADOR**, abra uma nova aba anônima
3. Tente agendar o mesmo horário (27/12 às 09:00)
4. O horário **DEVE ESTAR INDISPONÍVEL** (não clicável)

**No console, procure por:**
- `🔒 Agendamento pending_payment válido, bloqueando horário:`
- `📅 Agendamentos para o dia 2025-12-27: { pending_payment: 1 }`

**Se o horário ainda estiver disponível:**
- Verifique se o agendamento foi criado com `status: 'pending_payment'`
- Verifique se `tolerance_expires_at` está preenchido
- Verifique os logs no console

---

## 3️⃣ Verificar se o Cron Job Está Executando

### Execute este SQL no Supabase:

```sql
-- Verificar se o cron job está ativo
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'cancel-expired-appointments';

-- Ver histórico de execuções (últimas 10)
SELECT 
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = 1
ORDER BY start_time DESC 
LIMIT 10;
```

**O que procurar:**
- `active: true` = Cron job está ativo
- `status: 'succeeded'` = Executou com sucesso
- `start_time` = Quando executou pela última vez

**Se não estiver executando:**
- Verifique se `pg_cron` está habilitado
- Verifique se `pg_net` está habilitado
- Veja os logs do cron para erros

---

## 4️⃣ Verificar se a Mensagem Está Sendo Enviada

### Opção A: Ver Logs da Edge Function

1. Acesse: https://supabase.com/dashboard
2. Vá em **Edge Functions** > **cancel-expired-appointments** > **Logs**
3. Procure por:
   - `🔍 Buscando agendamentos expirados...`
   - `📊 Total de agendamentos encontrados`
   - `📱 Tentando enviar mensagem para cliente`
   - `✅ Mensagem de expiração enviada` ou `❌ Erro`

### Opção B: Testar Manualmente

1. Crie um agendamento com PIX
2. Execute este SQL para expirar manualmente:

```sql
-- Expirar um agendamento de teste (PostgreSQL não permite LIMIT em UPDATE diretamente)
UPDATE public.appointments
SET tolerance_expires_at = NOW() - INTERVAL '1 minute'
WHERE id IN (
  SELECT id FROM public.appointments
  WHERE status = 'pending_payment'
    AND tolerance_expires_at > NOW()
    AND cliente_zap IS NOT NULL
  LIMIT 1
);
```

3. Chame a Edge Function manualmente:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA"
```

4. Verifique os logs da Edge Function
5. Verifique se o WhatsApp recebeu a mensagem

---

## 5️⃣ Verificar Dados do Agendamento no Banco

Execute este SQL para ver agendamentos `pending_payment`:

```sql
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  data_hora,
  status,
  tolerance_expires_at,
  pix_payment_id,
  created_at
FROM public.appointments
WHERE status = 'pending_payment'
ORDER BY created_at DESC
LIMIT 10;
```

**O que verificar:**
- ✅ `status` = `'pending_payment'`
- ✅ `tolerance_expires_at` está preenchido
- ✅ `cliente_zap` está preenchido (necessário para enviar mensagem)
- ✅ `pix_payment_id` está preenchido

---

## 🐛 Problemas Comuns e Soluções

### Problema: Agendamento temporário não é criado
**Solução:**
- Execute `EXECUTAR_MIGRATION_PENDING_PAYMENT.sql` novamente
- Verifique se o constraint foi atualizado: `SELECT * FROM pg_constraint WHERE conname = 'appointments_status_check';`

### Problema: Horário ainda aparece disponível
**Solução:**
- Verifique se o agendamento foi criado: `SELECT * FROM appointments WHERE status = 'pending_payment';`
- Verifique os logs no console: `📅 Agendamentos encontrados:`
- Recarregue a página para atualizar a lista de agendamentos

### Problema: Cron job não executa
**Solução:**
- Verifique se está ativo: `SELECT * FROM cron.job WHERE jobname = 'cancel-expired-appointments';`
- Verifique se `pg_cron` está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verifique se `pg_net` está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`

### Problema: Mensagem não é enviada
**Solução:**
- Verifique se WhatsApp está conectado: `SELECT * FROM connections WHERE status = 'online';`
- Verifique se `cliente_zap` está preenchido no agendamento
- Verifique os logs da Edge Function para ver o erro específico

---

## ✅ Checklist Final

- [ ] Constraint atualizado com `pending_payment`
- [ ] Agendamento temporário sendo criado
- [ ] Horário sendo bloqueado corretamente
- [ ] Cron job executando a cada 2 minutos
- [ ] Agendamentos expirados sendo cancelados
- [ ] Mensagens WhatsApp sendo enviadas

---

## 📞 Próximos Passos

1. Teste criar um agendamento com PIX
2. Verifique se o horário fica bloqueado
3. Aguarde 15 minutos (ou expire manualmente)
4. Verifique se a mensagem foi enviada
5. Me informe o que encontrou nos logs!

