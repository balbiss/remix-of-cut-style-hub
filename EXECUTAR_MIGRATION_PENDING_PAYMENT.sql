-- ============================================================
-- ADICIONAR STATUS 'pending_payment' AO BANCO DE DADOS
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- ============================================================

-- Primeiro, remover o constraint antigo
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Recriar o constraint com 'pending_payment' incluído
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'pending_payment'));

-- Comentário explicativo
COMMENT ON COLUMN public.appointments.status IS 'Status do agendamento: pending (pendente), confirmed (confirmado), cancelled (cancelado), completed (concluído), pending_payment (aguardando pagamento PIX)';

-- Verificar se foi aplicado corretamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.appointments'::regclass
  AND conname = 'appointments_status_check';






