-- Adicionar status 'pending_payment' ao constraint da tabela appointments
-- Este status é usado para reservas temporárias aguardando pagamento PIX

-- Primeiro, remover o constraint antigo
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Recriar o constraint com 'pending_payment' incluído
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'pending_payment'));

-- Comentário explicativo
COMMENT ON COLUMN public.appointments.status IS 'Status do agendamento: pending (pendente), confirmed (confirmado), cancelled (cancelado), completed (concluído), pending_payment (aguardando pagamento PIX)';






