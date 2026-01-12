-- ============================================================
-- VERIFICAR DADOS DO AGENDAMENTO EXPIRADO
-- Execute este SQL para ver os dados do agendamento que foi cancelado
-- ============================================================

-- Ver agendamentos cancelados recentemente (últimos 10 minutos)
SELECT 
  id,
  cliente_nome,
  cliente_zap,
  tenant_id,
  status,
  tolerance_expires_at,
  pix_payment_id,
  created_at,
  updated_at,
  (tolerance_expires_at < NOW()) as expirado,
  EXTRACT(EPOCH FROM (NOW() - tolerance_expires_at))/60 as minutos_expirados
FROM public.appointments
WHERE status = 'cancelled'
  AND updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC
LIMIT 10;

-- Verificar se tem conexão WhatsApp para esses tenants
SELECT DISTINCT
  a.tenant_id,
  a.cliente_zap,
  c.status as whatsapp_status,
  c.instance_name,
  CASE 
    WHEN c.status = 'online' THEN '✅ WhatsApp Conectado'
    WHEN c.status IS NULL THEN '❌ Sem Conexão WhatsApp'
    ELSE '⚠️ WhatsApp ' || c.status
  END as status_whatsapp
FROM public.appointments a
LEFT JOIN public.connections c ON c.tenant_id = a.tenant_id AND c.status = 'online'
WHERE a.status = 'cancelled'
  AND a.updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY a.updated_at DESC
LIMIT 10;






