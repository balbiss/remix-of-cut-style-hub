-- ============================================================
-- EXPIRAR AGENDAMENTO PARA TESTAR MENSAGEM DE EXPIRAÇÃO
-- Execute este SQL para expirar um agendamento pending_payment
-- ============================================================

-- Expirar um agendamento pending_payment manualmente (usando subquery para LIMIT)
UPDATE public.appointments
SET tolerance_expires_at = NOW() - INTERVAL '1 minute'
WHERE id IN (
  SELECT id 
  FROM public.appointments
  WHERE status = 'pending_payment'
    AND tolerance_expires_at > NOW()
  LIMIT 1
);

-- Verificar se o agendamento foi expirado
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  status,
  tolerance_expires_at,
  (tolerance_expires_at < NOW()) as expirado,
  EXTRACT(EPOCH FROM (NOW() - tolerance_expires_at))/60 as minutos_expirados
FROM public.appointments
WHERE status = 'pending_payment'
  OR (status = 'cancelled' AND updated_at > NOW() - INTERVAL '5 minutes')
ORDER BY updated_at DESC
LIMIT 5;






