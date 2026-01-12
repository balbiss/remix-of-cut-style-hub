-- ============================================================
-- Adicionar campos de estorno na tabela appointments
-- ============================================================

-- Adicionar campos para controle de estorno
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS refunded BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Comentários
COMMENT ON COLUMN public.appointments.refunded IS 'Indica se o pagamento foi estornado';
COMMENT ON COLUMN public.appointments.refunded_at IS 'Data e hora do estorno';
COMMENT ON COLUMN public.appointments.refund_amount IS 'Valor estornado';
COMMENT ON COLUMN public.appointments.refund_reason IS 'Motivo do estorno';






