-- Adicionar campo mp_access_token na tabela tenants
-- Este campo armazena o Access Token do Mercado Pago (necessário para criar pagamentos)
-- Diferente da mp_public_key que é usada apenas para validação no frontend

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS mp_access_token TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.tenants.mp_access_token IS 'Access Token do Mercado Pago para criar pagamentos PIX. Deve ser mantido em segredo.';






