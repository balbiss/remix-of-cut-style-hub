# Como fazer deploy da Edge Function create-pix-payment

## Opção 1: Usando Supabase CLI (Recomendado)

1. Instale o Supabase CLI se ainda não tiver:
```bash
npm install -g supabase
```

2. Faça login no Supabase:
```bash
supabase login
```

3. Link o projeto:
```bash
supabase link --project-ref itrxoadmfbynnxokigha
```

4. Faça o deploy da função com a flag para desabilitar JWT:
```bash
supabase functions deploy create-pix-payment --no-verify-jwt
```

**OU** se já fez o deploy, faça novamente para garantir que o `verify_jwt = false` seja aplicado:
```bash
supabase functions deploy create-pix-payment
```

## Opção 2: Usando o Dashboard do Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "Edge Functions" no menu lateral
4. Clique em "Create a new function"
5. Nomeie como `create-pix-payment`
6. Cole o conteúdo do arquivo `supabase/functions/create-pix-payment/index.ts`
7. Clique em "Deploy"

## Após o deploy

A função estará disponível em:
`https://itrxoadmfbynnxokigha.supabase.co/functions/v1/create-pix-payment`

**IMPORTANTE:** Após o deploy, verifique no Dashboard do Supabase:
1. Vá em "Edge Functions" > "create-pix-payment"
2. Vá na aba "Details"
3. Certifique-se de que "Verify JWT" está **DESABILITADO** (OFF)
4. Se estiver habilitado, desabilite e salve

Isso garante que a função não valide JWT mesmo com `verify_jwt = false` no config.toml.

## Verificar se está funcionando

Você pode testar a função usando curl:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/create-pix-payment \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "apikey: SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15.00,
    "description": "Teste PIX",
    "tenant_id": "SEU_TENANT_ID"
  }'
```

