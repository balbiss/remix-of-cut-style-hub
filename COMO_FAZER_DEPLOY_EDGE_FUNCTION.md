# 🚀 Como Fazer Deploy da Edge Function

## Opção 1: Pelo Supabase Dashboard (Mais Fácil)

1. **Acesse o Supabase Dashboard:**
   - Vá em: https://supabase.com/dashboard/project/itrxoadmfbynnxokigha/functions

2. **Selecione a Edge Function:**
   - Clique em `cancel-expired-appointments`

3. **Vá para a aba "Code":**
   - Clique na aba "Code" no topo

4. **Cole o código atualizado:**
   - Abra o arquivo `supabase/functions/cancel-expired-appointments/index.ts`
   - Copie TODO o conteúdo
   - Cole no editor do Dashboard
   - Clique em "Deploy" ou "Save"

## Opção 2: Pelo Supabase CLI (Requer Configuração)

### 1. Linkar o projeto primeiro:

```bash
npx supabase link --project-ref itrxoadmfbynnxokigha
```

Você precisará do `SUPABASE_ACCESS_TOKEN`. Para obter:
- Vá em: https://supabase.com/dashboard/account/tokens
- Crie um novo token
- Use quando solicitado

### 2. Fazer o deploy:

```bash
npx supabase functions deploy cancel-expired-appointments
```

## Opção 3: Copiar e Colar Manualmente (Mais Rápido)

1. Abra o arquivo: `supabase/functions/cancel-expired-appointments/index.ts`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Vá em: https://supabase.com/dashboard/project/itrxoadmfbynnxokigha/functions/cancel-expired-appointments/code
4. Cole o código (Ctrl+V)
5. Clique em "Deploy" ou "Save"

## ⚠️ Importante

Após o deploy, você precisa:
1. Criar um novo agendamento de teste expirado
2. Chamar a Edge Function manualmente: `node CHAMAR_EDGE_FUNCTION_MANUAL.js`
3. Verificar os logs detalhados no Dashboard






