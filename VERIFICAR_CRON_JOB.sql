-- ============================================================
-- VERIFICAR SE O CRON JOB ESTÁ FUNCIONANDO
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- 1. Ver o cron job criado
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job 
WHERE jobname = 'cancel-expired-appointments';

-- 2. Ver histórico de execuções (últimas 10)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cancel-expired-appointments')
ORDER BY start_time DESC 
LIMIT 10;

-- 3. Ver logs da Edge Function (via Dashboard)
-- Vá em: Edge Functions > cancel-expired-appointments > Logs

-- ============================================================
-- COMANDOS ÚTEIS:
-- ============================================================

-- Desativar temporariamente (se necessário)
-- UPDATE cron.job SET active = false WHERE jobname = 'cancel-expired-appointments';

-- Reativar
-- UPDATE cron.job SET active = true WHERE jobname = 'cancel-expired-appointments';

-- Remover completamente (se necessário)
-- SELECT cron.unschedule('cancel-expired-appointments');






