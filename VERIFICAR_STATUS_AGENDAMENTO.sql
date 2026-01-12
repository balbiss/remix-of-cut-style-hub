-- ============================================================
-- VERIFICAR STATUS DO AGENDAMENTO EXPIRADO
-- Execute este SQL para ver o status atual do agendamento
-- ============================================================

-- Verificar o agendamento específico que foi expirado
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  tenant_id,
  status,
  tolerance_expires_at,
  updated_at,
  (tolerance_expires_at < NOW()) as expirado,
  EXTRACT(EPOCH FROM (NOW() - tolerance_expires_at))/60 as minutos_expirados
FROM public.appointments
WHERE id = 'ef39be65-aaa6-4985-8ee5-d2a900170a01';

-- Verificar TODOS os agendamentos pending_payment que estão expirados
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  tenant_id,
  status,
  tolerance_expires_at,
  updated_at,
  (tolerance_expires_at < NOW()) as expirado,
  EXTRACT(EPOCH FROM (NOW() - tolerance_expires_at))/60 as minutos_expirados
FROM public.appointments
WHERE status = 'pending_payment'
  AND tolerance_expires_at IS NOT NULL
  AND tolerance_expires_at < NOW()
ORDER BY tolerance_expires_at DESC;






