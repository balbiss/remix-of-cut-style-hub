-- Adicionar campo pix_payment_id na tabela appointments
-- Este campo armazena o ID do pagamento PIX criado no Mercado Pago

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS pix_payment_id TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.appointments.pix_payment_id IS 'ID do pagamento PIX criado no Mercado Pago para rastreamento';

-- Índice para facilitar buscas por pagamento
CREATE INDEX IF NOT EXISTS idx_appointments_pix_payment_id ON public.appointments(pix_payment_id);






