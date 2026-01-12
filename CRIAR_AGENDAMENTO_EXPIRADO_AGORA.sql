-- ============================================================
-- CRIAR AGENDAMENTO DE TESTE JÁ EXPIRADO (NO PASSADO)
-- Execute este SQL para criar um agendamento pending_payment que já está expirado
-- ============================================================

-- Primeiro, limpar agendamentos de teste anteriores
DELETE FROM public.appointments
WHERE cliente_nome = 'Teste Expiração';

-- Criar um agendamento pending_payment que já está expirado (2 minutos atrás)
INSERT INTO public.appointments (
  tenant_id,
  professional_id,
  service_id,
  data_hora,
  cliente_nome,
  cliente_zap,
  status,
  payment_method,
  prepaid_amount,
  tolerance_expires_at,
  pix_payment_id
)
SELECT 
  'd35f0122-eaa9-4382-882a-5dfa30bceda7'::uuid, -- tenant_id
  p.id, -- professional_id (primeiro profissional do tenant)
  s.id, -- service_id (primeiro serviço do tenant)
  NOW() + INTERVAL '1 day', -- data_hora (amanhã)
  'Teste Expiração', -- cliente_nome
  '(11) 98438-8245', -- cliente_zap
  'pending_payment', -- status
  'online', -- payment_method
  15.00, -- prepaid_amount
  NOW() - INTERVAL '2 minutes', -- tolerance_expires_at (expirado há 2 minutos)
  'TESTE-' || EXTRACT(EPOCH FROM NOW())::text -- pix_payment_id (fake)
FROM public.professionals p
CROSS JOIN public.services s
WHERE p.tenant_id = 'd35f0122-eaa9-4382-882a-5dfa30bceda7'::uuid
  AND s.tenant_id = 'd35f0122-eaa9-4382-882a-5dfa30bceda7'::uuid
LIMIT 1
RETURNING id, cliente_nome, cliente_zap, status, tolerance_expires_at, (tolerance_expires_at < NOW()) as expirado;

-- Verificar se foi criado e está expirado
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  tenant_id,
  status,
  tolerance_expires_at,
  NOW() as agora_utc,
  (tolerance_expires_at < NOW()) as expirado,
  EXTRACT(EPOCH FROM (NOW() - tolerance_expires_at))/60 as minutos_expirados
FROM public.appointments
WHERE cliente_nome = 'Teste Expiração'
ORDER BY created_at DESC
LIMIT 1;






