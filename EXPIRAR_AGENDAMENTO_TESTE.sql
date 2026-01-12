-- ============================================================
-- EXPIRAR AGENDAMENTO DE TESTE MANUALMENTE
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- Expirar um agendamento pending_payment (definir expiração para 1 minuto atrás)
-- PostgreSQL não permite LIMIT diretamente em UPDATE, então usamos subquery
UPDATE public.appointments
SET tolerance_expires_at = NOW() - INTERVAL '1 minute'
WHERE id IN (
  SELECT id FROM public.appointments
  WHERE status = 'pending_payment'
    AND tolerance_expires_at > NOW()
    AND cliente_zap IS NOT NULL
  LIMIT 1
);

-- Verificar se foi atualizado
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  status,
  tolerance_expires_at,
  NOW() as agora,
  (tolerance_expires_at < NOW()) as expirado
FROM public.appointments
WHERE status = 'pending_payment'
ORDER BY created_at DESC
LIMIT 5;






