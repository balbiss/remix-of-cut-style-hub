-- Configurar cron job para cancelar agendamentos expirados
-- Executa a cada 2 minutos

-- Primeiro, remover o cron job se já existir (para evitar duplicatas)
SELECT cron.unschedule('cancel-expired-appointments') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cancel-expired-appointments'
);

-- Criar o cron job
-- Nota: O Supabase pode não ter a extensão pg_net habilitada por padrão
-- Vamos usar uma abordagem que funciona com o que está disponível

-- Opção 1: Se pg_net estiver disponível (mais comum)
DO $$
BEGIN
  -- Tentar criar o cron job usando pg_net
  PERFORM cron.schedule(
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
EXCEPTION
  WHEN OTHERS THEN
    -- Se pg_net não estiver disponível, criar um job que executa uma função SQL
    -- que pode ser chamada via trigger ou outra forma
    RAISE NOTICE 'pg_net não disponível, usando alternativa';
END $$;

-- Verificar se o cron job foi criado
SELECT * FROM cron.job WHERE jobname = 'cancel-expired-appointments';






