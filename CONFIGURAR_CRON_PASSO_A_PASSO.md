# 🚀 Configurar Cron Job - Passo a Passo

Este guia vai te ajudar a configurar o cancelamento automático de agendamentos expirados.

## 📋 Pré-requisitos

Você precisa ter:
- URL do seu projeto Supabase: `https://itrxoadmfbynnxokigha.supabase.co`
- Anon Key do Supabase (encontra no Dashboard > Settings > API)

---

## 🎯 Opção 1: Usar Serviço Gratuito (EasyCron) - RECOMENDADO

Esta é a forma mais fácil e não requer conhecimento técnico.

### Passo 1: Criar conta no EasyCron
1. Acesse: https://www.easycron.com/
2. Clique em **"Sign Up"** (canto superior direito)
3. Crie uma conta gratuita (permite até 2 cron jobs)

### Passo 2: Criar novo Cron Job
1. Após fazer login, clique em **"Add New Cron Job"**
2. Preencha os campos:

**Cron Job Name:**
```
Cancelar Agendamentos Expirados
```

**Cron Expression:**
```
*/2 * * * *
```
(Isso executa a cada 2 minutos)

**URL:**
```
https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments
```

**HTTP Method:**
```
POST
```

**HTTP Headers:**
Clique em **"Add Header"** e adicione:
- **Header Name:** `Content-Type`
- **Header Value:** `application/json`

Clique em **"Add Header"** novamente e adicione:
- **Header Name:** `apikey`
- **Header Value:** `SUA_SUPABASE_ANON_KEY_AQUI`
  (Substitua pela sua Anon Key do Supabase)

**HTTP Body:**
```
{}
```

### Passo 3: Salvar e Ativar
1. Role até o final da página
2. Marque a opção **"Enabled"** (ativado)
3. Clique em **"Save"**

### Passo 4: Testar
1. Clique no nome do cron job criado
2. Clique em **"Run Now"** para testar manualmente
3. Verifique os logs para ver se funcionou

---

## 🎯 Opção 2: Usar cron-job.org (Alternativa Gratuita)

### Passo 1: Criar conta
1. Acesse: https://cron-job.org/
2. Clique em **"Sign Up"** e crie uma conta gratuita

### Passo 2: Criar novo Job
1. Após login, clique em **"Create cronjob"**
2. Preencha:

**Title:**
```
Cancelar Agendamentos Expirados
```

**Address (URL):**
```
https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments
```

**Schedule:**
- Selecione **"Every minute"** ou **"Every 2 minutes"**

**Request Method:**
```
POST
```

**Request Headers:**
Clique em **"Add Header"**:
- **Name:** `Content-Type`
- **Value:** `application/json`

Clique em **"Add Header"** novamente:
- **Name:** `apikey`
- **Value:** `SUA_SUPABASE_ANON_KEY_AQUI`

**Request Body:**
```
{}
```

### Passo 3: Salvar
1. Clique em **"Create"**
2. O job será executado automaticamente

---

## 🔍 Como Encontrar sua Supabase Anon Key

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione seu projeto: `itrxoadmfbynnxokigha`
4. Vá em **Settings** (ícone de engrenagem no menu lateral)
5. Clique em **API**
6. Procure por **"anon public"** key
7. Copie essa chave (ela começa com `eyJhbGci...`)

---

## ✅ Verificar se está funcionando

### Opção A: Verificar logs no Supabase
1. Acesse: https://supabase.com/dashboard
2. Vá em **Edge Functions** (menu lateral)
3. Clique em **cancel-expired-appointments**
4. Veja a aba **"Logs"** para verificar execuções

### Opção B: Testar manualmente
Abra o terminal e execute:

```bash
curl -X POST https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_SUPABASE_ANON_KEY"
```

Se funcionar, você verá uma resposta como:
```json
{
  "success": true,
  "message": "0 agendamento(s) expirado(s) cancelado(s), 0 mensagem(ns) enviada(s)",
  "cancelled": 0,
  "messages_sent": 0
}
```

---

## 🐛 Problemas Comuns

### Erro 401 (Unauthorized)
- Verifique se a `apikey` está correta
- Certifique-se de que está usando a **anon key**, não a service_role key

### Erro 404 (Not Found)
- Verifique se a URL está correta
- Certifique-se de que a Edge Function foi deployada

### Mensagens não estão sendo enviadas
- Verifique se o WhatsApp está conectado (`status = 'online'`)
- Verifique se o cliente tem número cadastrado (`cliente_zap`)
- Veja os logs da Edge Function para mais detalhes

---

## 📝 Resumo Rápido

1. ✅ Criar conta no EasyCron ou cron-job.org
2. ✅ Criar novo cron job com:
   - URL: `https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments`
   - Método: `POST`
   - Headers: `Content-Type: application/json` e `apikey: SUA_ANON_KEY`
   - Frequência: A cada 1-2 minutos
3. ✅ Ativar o cron job
4. ✅ Testar manualmente
5. ✅ Verificar logs

---

## 🎉 Pronto!

Agora o sistema vai:
- ✅ Verificar agendamentos expirados a cada 1-2 minutos
- ✅ Cancelar automaticamente agendamentos `pending_payment` após 15 minutos
- ✅ Enviar mensagem WhatsApp para o cliente informando que o tempo expirou
- ✅ Liberar o horário para novos agendamentos






