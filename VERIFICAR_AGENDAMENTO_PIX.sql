-- Verificar se o agendamento tem pix_payment_id e outros campos de pagamento
-- Substitua 'Marcelino Balbis' pelo nome do cliente que você quer verificar

SELECT 
  id,
  cliente_nome,
  status,
  payment_method,
  pix_payment_id,
  prepaid_amount,
  refunded,
  refunded_at,
  refund_amount,
  refund_reason,
  data_hora
FROM appointments
WHERE cliente_nome ILIKE '%Marcelino%'
  OR cliente_nome ILIKE '%Balbis%'
ORDER BY data_hora DESC
LIMIT 10;

-- Verificar todos os agendamentos confirmados com PIX
SELECT 
  id,
  cliente_nome,
  status,
  payment_method,
  pix_payment_id,
  prepaid_amount,
  refunded,
  data_hora
FROM appointments
WHERE status = 'confirmed'
  AND pix_payment_id IS NOT NULL
  AND refunded = false
ORDER BY data_hora DESC;






