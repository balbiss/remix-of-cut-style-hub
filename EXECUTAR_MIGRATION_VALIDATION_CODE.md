# 🗄️ Executar Migration - Código de Validação de Resgates

Esta migration adiciona os campos necessários para o sistema de validação por código de resgates de fidelidade.

## 📋 O que esta migration faz:

1. Adiciona campo `validation_code` (VARCHAR(6)) na tabela `loyalty_redemptions`
2. Adiciona campo `expires_at` (TIMESTAMP) para controlar expiração dos códigos
3. Cria índices para melhorar performance das consultas

## ✅ Como Executar:

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto (ID: `itrxoadmfbynnxokigha`)
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `supabase/migrations/20251226210000_add_redemption_validation_code.sql`:

```sql
-- Add validation_code column to loyalty_redemptions table
ALTER TABLE public.loyalty_redemptions 
ADD COLUMN IF NOT EXISTS validation_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups by validation code
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_validation_code 
ON public.loyalty_redemptions(validation_code) 
WHERE validation_code IS NOT NULL;

-- Create index for pending redemptions
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_pending 
ON public.loyalty_redemptions(tenant_id, status) 
WHERE status = 'pending';
```

6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de sucesso ✅

### Opção 2: Via Supabase CLI (Se tiver instalado)

```bash
cd remix-of-cut-style-hub
supabase db push
```

### Opção 3: Executar SQL Diretamente

Se preferir, você pode executar cada comando separadamente no SQL Editor:

```sql
-- 1. Adicionar coluna validation_code
ALTER TABLE public.loyalty_redemptions 
ADD COLUMN IF NOT EXISTS validation_code VARCHAR(6);

-- 2. Adicionar coluna expires_at
ALTER TABLE public.loyalty_redemptions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Criar índice para validation_code
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_validation_code 
ON public.loyalty_redemptions(validation_code) 
WHERE validation_code IS NOT NULL;

-- 4. Criar índice para resgates pendentes
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_pending 
ON public.loyalty_redemptions(tenant_id, status) 
WHERE status = 'pending';
```

## ✅ Verificar se funcionou:

Execute esta query no SQL Editor para verificar:

```sql
-- Verificar se as colunas foram adicionadas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'loyalty_redemptions'
  AND column_name IN ('validation_code', 'expires_at')
ORDER BY column_name;
```

Você deve ver:
- `validation_code` | `character varying` | `YES`
- `expires_at` | `timestamp with time zone` | `YES`

## ⚠️ Importante:

- A migration usa `IF NOT EXISTS`, então é seguro executar múltiplas vezes
- Não afeta dados existentes (apenas adiciona novas colunas)
- Os resgates existentes terão `validation_code = NULL` até serem atualizados

## 🎉 Pronto!

Após executar a migration, o sistema de validação por código estará funcionando completamente!


