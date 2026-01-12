# Configuração do Cron Job para Cancelar Agendamentos Expirados

A Edge Function `cancel-expired-appointments` precisa ser chamada periodicamente para cancelar agendamentos `pending_payment` que expiraram (após 15 minutos) e enviar mensagens WhatsApp aos clientes.

## Opção 1: Cron Job no Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Database** > **Cron Jobs** (ou **Database** > **Extensions** > **pg_cron**)
3. Crie um novo cron job com a seguinte configuração:

```sql
-- Executar a cada 1 minuto
SELECT cron.schedule(
  'cancel-expired-appointments',
  '*/1 * * * *', -- A cada 1 minuto
  $$
  SELECT
    net.http_post(
      url := 'https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'SUA_SUPABASE_ANON_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**OU** usando a extensão `pg_net` (se disponível):

```sql
SELECT cron.schedule(
  'cancel-expired-appointments',
  '*/1 * * * *', -- A cada 1 minuto
  $$
  SELECT net.http_post(
    url := 'https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments',
    headers := '{"Content-Type": "application/json", "apikey": "SUA_SUPABASE_ANON_KEY"}'::jsonb
  );
  $$
);
```

## Opção 2: Usar Supabase CLI (se disponível)

```bash
supabase functions deploy cancel-expired-appointments
```

E configure o cron job via SQL:

```sql
SELECT cron.schedule(
  'cancel-expired-appointments',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments',
    headers := '{"Content-Type": "application/json", "apikey": "SUA_SUPABASE_ANON_KEY"}'::jsonb
  );
  $$
);
```

## Opção 3: Serviço Externo (EasyCron, cron-job.org, etc.)

Configure um serviço de cron job externo para chamar:

```
POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments
Headers:
  Content-Type: application/json
  apikey: SUA_SUPABASE_ANON_KEY
```

Com frequência: **A cada 1-2 minutos**

## Verificar se está funcionando

Após configurar, você pode verificar os logs no Supabase Dashboard:
- **Edge Functions** > **cancel-expired-appointments** > **Logs**

Ou chamar manualmente para testar:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_SUPABASE_ANON_KEY"
```

## Importante

- A função verifica agendamentos `pending_payment` onde `tolerance_expires_at < now()`
- Cancela os agendamentos e envia mensagem WhatsApp se o cliente tiver número cadastrado
- Requer que o WhatsApp esteja conectado (`status = 'online'`) para enviar mensagens






