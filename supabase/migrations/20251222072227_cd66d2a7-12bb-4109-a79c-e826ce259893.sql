-- Adicionar colunas na tabela professionals
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS email VARCHAR;

ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS commission_percent NUMERIC DEFAULT 50;

-- Criar índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);

-- Função helper para pegar o professional_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_professional_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.professionals WHERE user_id = _user_id LIMIT 1
$$;

-- Função helper para verificar se usuário é barbeiro
CREATE OR REPLACE FUNCTION public.is_barber(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'barber'
  )
$$;