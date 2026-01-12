-- ============================================================
-- CONFIGURAR CRON JOB NO SUPABASE
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- ============================================================

-- PASSO 1: Habilitar extensões (se ainda não estiverem habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- PASSO 2: Remover cron job existente (se houver)
SELECT cron.unschedule('cancel-expired-appointments') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cancel-expired-appointments'
);

-- PASSO 3: Criar novo cron job (executa a cada 2 minutos)
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

-- PASSO 4: Verificar se foi criado
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job 
WHERE jobname = 'cancel-expired-appointments';

-- ============================================================
-- COMANDOS ÚTEIS:
-- ============================================================

-- Ver todos os cron jobs
-- SELECT * FROM cron.job;

-- Ver histórico de execuções
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cancel-expired-appointments')
-- ORDER BY start_time DESC LIMIT 10;

-- Desativar cron job (se necessário)
-- SELECT cron.unschedule('cancel-expired-appointments');

-- Reativar cron job
-- UPDATE cron.job SET active = true WHERE jobname = 'cancel-expired-appointments';






