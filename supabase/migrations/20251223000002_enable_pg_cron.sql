-- Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verificar se a extensão foi habilitada
SELECT * FROM pg_extension WHERE extname = 'pg_cron';






