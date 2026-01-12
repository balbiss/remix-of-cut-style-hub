# 🚀 Configurar Cron Job no Supabase - Passo a Passo

Vamos configurar o cron job diretamente no Supabase usando a extensão `pg_cron`.

## 📋 Passo 1: Habilitar Extensão pg_cron

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto: `itrxoadmfbynnxokigha`
3. Vá em **Database** (menu lateral)
4. Clique em **Extensions** (ou procure por "Extensions" na barra de busca)
5. Procure por **"pg_cron"** na lista
6. Se não estiver habilitada, clique em **"Enable"** ou **"Ativar"**

**OU** execute este SQL no **SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

## 📋 Passo 2: Habilitar Extensão pg_net (se necessário)

A extensão `pg_net` é necessária para fazer requisições HTTP do banco de dados.

1. No mesmo lugar (**Database > Extensions**)
2. Procure por **"pg_net"**
3. Se não estiver habilitada, clique em **"Enable"**

**OU** execute este SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 📋 Passo 3: Criar o Cron Job

1. No Supabase Dashboard, vá em **SQL Editor** (menu lateral)
2. Clique em **"New Query"**
3. Cole o seguinte SQL:

```sql
-- Remover cron job existente se houver
SELECT cron.unschedule('cancel-expired-appointments') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cancel-expired-appointments'
);

-- Criar novo cron job (executa a cada 2 minutos)
SELECT cron.schedule(
  'cancel-expired-appointments',
  '*/2 * * * *', -- A cada 2 minutos
  $$
  SELECT
    net.http_post(
      url := 'https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

4. Clique em **"Run"** ou pressione `Ctrl+Enter`

---

## 📋 Passo 4: Verificar se Funcionou

Execute este SQL para verificar:

```sql
-- Ver todos os cron jobs
SELECT * FROM cron.job WHERE jobname = 'cancel-expired-appointments';

-- Ver histórico de execuções (últimas 10)
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname = 'cancel-expired-appointments';
```

Você deve ver uma linha com o cron job criado.

---

## 📋 Passo 5: Verificar Logs

1. Vá em **Edge Functions** (menu lateral)
2. Clique em **cancel-expired-appointments**
3. Veja a aba **"Logs"** para verificar as execuções

**OU** verifique os logs do cron job:

```sql
-- Ver logs do cron (se disponível)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cancel-expired-appointments')
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🔧 Alternativa: Se pg_net não estiver disponível

Se você receber um erro dizendo que `pg_net` não está disponível, você pode:

### Opção A: Usar uma função SQL que atualiza diretamente

```sql
-- Criar função que cancela agendamentos expirados
CREATE OR REPLACE FUNCTION cancel_expired_appointments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Atualizar agendamentos expirados
  UPDATE appointments
  SET status = 'cancelled'
  WHERE status = 'pending_payment'
    AND tolerance_expires_at IS NOT NULL
    AND tolerance_expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RAISE NOTICE 'Cancelados % agendamentos expirados', expired_count;
END;
$$;

-- Criar cron job que chama a função
SELECT cron.schedule(
  'cancel-expired-appointments',
  '*/2 * * * *',
  'SELECT cancel_expired_appointments();'
);
```

**Nota:** Esta opção não envia mensagens WhatsApp automaticamente. As mensagens seriam enviadas pela Edge Function quando ela for chamada de outra forma, ou você precisaria adicionar a lógica de envio de WhatsApp diretamente na função SQL (mais complexo).

---

## ✅ Verificar se Está Funcionando

### Teste Manual da Edge Function:

Execute no terminal:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA"
```

---

## 🐛 Problemas Comuns

### Erro: "extension pg_cron does not exist"
- A extensão não está habilitada
- Vá em **Database > Extensions** e habilite `pg_cron`

### Erro: "function net.http_post does not exist"
- A extensão `pg_net` não está habilitada
- Vá em **Database > Extensions** e habilite `pg_net`

### Erro: "permission denied"
- Você precisa ter permissões de superuser ou admin
- Verifique se está usando a conta correta

### Cron job não executa
- Verifique se está ativo: `SELECT * FROM cron.job WHERE jobname = 'cancel-expired-appointments';`
- Verifique os logs do cron: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

---

## 🎉 Pronto!

Agora o cron job está configurado no Supabase e vai:
- ✅ Executar a cada 2 minutos
- ✅ Chamar a Edge Function automaticamente
- ✅ Cancelar agendamentos expirados
- ✅ Enviar mensagens WhatsApp






