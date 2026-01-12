-- ============================================================
-- VERIFICAR CONEXÃO WHATSAPP DO TENANT
-- Execute este SQL para verificar se o WhatsApp está conectado
-- ============================================================

-- Verificar conexão WhatsApp para o tenant do agendamento cancelado
SELECT 
  c.id,
  c.tenant_id,
  c.instance_name,
  c.status as whatsapp_status,
  c.api_instance_token IS NOT NULL as tem_token,
  c.last_connected_at,
  c.messages_sent,
  t.nome as nome_barbearia
FROM public.connections c
INNER JOIN public.tenants t ON t.id = c.tenant_id
WHERE c.tenant_id = 'd35f0122-eaa9-4382-882a-5dfa30bceda7'
ORDER BY c.created_at DESC
LIMIT 5;

-- Verificar TODAS as conexões WhatsApp (para debug)
SELECT 
  c.id,
  c.tenant_id,
  c.instance_name,
  c.status,
  c.api_instance_token IS NOT NULL as tem_token,
  t.nome as nome_barbearia
FROM public.connections c
LEFT JOIN public.tenants t ON t.id = c.tenant_id
ORDER BY c.created_at DESC;






