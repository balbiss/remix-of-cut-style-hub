# 📊 Como Monitorar o Cron Job

O cron job está configurado e ativo! Agora você pode monitorar se está funcionando.

## ✅ Status Atual

Seu cron job está:
- ✅ **Criado** (jobid: 1)
- ✅ **Ativo** (active: true)
- ✅ **Agendado** para executar a cada 2 minutos

---

## 🔍 Como Verificar se Está Executando

### Opção 1: Ver Logs do Cron Job (SQL)

Execute este SQL no **SQL Editor**:

```sql
SELECT 
  jobid,
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
- `status: 'succeeded'` = Executou com sucesso
- `status: 'failed'` = Houve erro (veja `return_message`)
- `start_time` = Quando executou
- Se não aparecer nada = Ainda não executou (aguarde alguns minutos)

---

### Opção 2: Ver Logs da Edge Function

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Edge Functions** (menu lateral)
4. Clique em **cancel-expired-appointments**
5. Veja a aba **"Logs"**

**O que procurar:**
- Requisições POST a cada 2 minutos
- Respostas com `"success": true`
- Mensagens como: `"0 agendamento(s) expirado(s) cancelado(s)"`

---

### Opção 3: Testar Manualmente

Execute no terminal:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA"
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "0 agendamento(s) expirado(s) cancelado(s), 0 mensagem(ns) enviada(s)",
  "cancelled": 0,
  "messages_sent": 0
}
```

---

## ⏰ Quando Vai Executar?

- **Primeira execução:** Dentro de 2 minutos após a criação
- **Próximas execuções:** A cada 2 minutos automaticamente
- **Horário:** 24/7 (sempre ativo)

---

## 🎯 O Que Acontece Quando Executa?

1. ✅ Busca agendamentos `pending_payment` onde `tolerance_expires_at < now()`
2. ✅ Cancela esses agendamentos (status: `cancelled`)
3. ✅ Envia mensagem WhatsApp para cada cliente (se tiver número cadastrado)
4. ✅ Libera os horários para novos agendamentos

---

## 🐛 Problemas Comuns

### Cron job não aparece nos logs
- **Aguarde alguns minutos** - pode levar até 2 minutos para a primeira execução
- Verifique se `active = true` no SQL

### Status "failed" nos logs
- Verifique os logs da Edge Function para ver o erro
- Verifique se `pg_net` está habilitada
- Verifique se a URL da Edge Function está correta

### Nenhum agendamento sendo cancelado
- Isso é normal se não houver agendamentos expirados
- O resultado será: `"cancelled": 0`

---

## ✅ Tudo Pronto!

Seu sistema agora está configurado para:
- ✅ Executar automaticamente a cada 2 minutos
- ✅ Cancelar agendamentos expirados (após 15 minutos)
- ✅ Enviar mensagens WhatsApp automaticamente
- ✅ Liberar horários para novos agendamentos

**Aguarde alguns minutos e verifique os logs para confirmar que está executando!**






