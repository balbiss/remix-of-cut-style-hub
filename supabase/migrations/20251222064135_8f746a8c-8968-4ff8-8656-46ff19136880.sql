-- Adicionar coluna slug na tabela tenants
ALTER TABLE public.tenants 
ADD COLUMN slug character varying UNIQUE;

-- Gerar slugs para tenants existentes baseado no nome
UPDATE public.tenants 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(nome, 'áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ', 'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'),
      '[^a-zA-Z0-9\s]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || SUBSTRING(id::text, 1, 4)
WHERE slug IS NULL;

-- Tornar slug obrigatório após popular
ALTER TABLE public.tenants 
ALTER COLUMN slug SET NOT NULL;

-- Criar índice para busca por slug
CREATE INDEX idx_tenants_slug ON public.tenants(slug);