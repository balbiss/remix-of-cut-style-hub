# 🚀 Configurar EasyCron - COM SEUS DADOS JÁ PREENCHIDOS

## 📋 Passo a Passo Detalhado

### 1️⃣ Criar Conta no EasyCron

1. Acesse: **https://www.easycron.com/**
2. Clique em **"Sign Up"** (canto superior direito)
3. Preencha:
   - Email
   - Senha
   - Confirme a senha
4. Clique em **"Sign Up"**
5. Verifique seu email e confirme a conta

---

### 2️⃣ Criar Novo Cron Job

Após fazer login:

1. Clique no botão **"Add New Cron Job"** (botão verde/laranja no topo)
2. Preencha os campos EXATAMENTE como abaixo:

---

### 📝 Campos para Preencher:

#### **Cron Job Name:**
```
Cancelar Agendamentos Expirados
```

#### **Cron Expression:**
```
*/2 * * * *
```
*(Isso executa a cada 2 minutos)*

#### **URL:**
```
https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments
```

#### **HTTP Method:**
Selecione: **POST**

#### **HTTP Headers:**

Clique no botão **"Add Header"** e adicione o primeiro header:

- **Header Name:** `Content-Type`
- **Header Value:** `application/json`

Clique em **"Add Header"** novamente e adicione o segundo header:

- **Header Name:** `apikey`
- **Header Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA`

Clique em **"Add Header"** mais uma vez e adicione o terceiro header:

- **Header Name:** `Authorization`
- **Header Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA`

#### **HTTP Body:**
```
{}
```

#### **Enabled:**
✅ Marque a checkbox **"Enabled"** (ativado)

---

### 3️⃣ Salvar

1. Role até o final da página
2. Clique no botão **"Save"** (ou "Add Cron Job")
3. Aguarde a confirmação

---

### 4️⃣ Testar

1. Na lista de cron jobs, encontre o que você acabou de criar
2. Clique no **nome** do cron job
3. Clique no botão **"Run Now"** (Executar Agora)
4. Aguarde alguns segundos
5. Clique em **"View Logs"** ou **"Logs"** para ver o resultado

**Resultado esperado:**
```json
{
  "success": true,
  "message": "0 agendamento(s) expirado(s) cancelado(s), 0 mensagem(ns) enviada(s)",
  "cancelled": 0,
  "messages_sent": 0
}
```

*(Se não houver agendamentos expirados no momento, `cancelled` será 0, o que é normal)*

---

## ✅ Verificar se Está Funcionando

### Opção A: Ver Logs no EasyCron
1. Clique no nome do cron job
2. Vá na aba **"Logs"**
3. Você verá as execuções a cada 2 minutos

### Opção B: Ver Logs no Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Edge Functions** (menu lateral)
4. Clique em **cancel-expired-appointments**
5. Veja a aba **"Logs"**

---

## 🎯 Resumo Rápido

✅ **URL:** `https://itrxoadmfbynnxokigha.supabase.co/functions/v1/cancel-expired-appointments`  
✅ **Método:** `POST`  
✅ **Header 1:** `Content-Type: application/json`  
✅ **Header 2:** `apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA`  
✅ **Header 3:** `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnhvYWRtZmJ5bm54b2tpZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjUxMDYsImV4cCI6MjA3OTMwMTEwNn0.AmAAZjKlLXbts4Wvdhd5nfPXmoSvFpe7WvBn7nP51tA`  
✅ **Body:** `{}`  
✅ **Frequência:** A cada 2 minutos (`*/2 * * * *`)  
✅ **Status:** Enabled (Ativado)

---

## 🐛 Problemas?

### Se der erro 401:
- Verifique se copiou a `apikey` completa (é muito longa)
- Certifique-se de que não há espaços extras

### Se der erro 404:
- Verifique se a URL está correta
- Certifique-se de que a Edge Function foi deployada no Supabase

### Se não executar:
- Verifique se marcou "Enabled"
- Verifique se a conta do EasyCron está ativa
- Veja os logs para mais detalhes

---

## 🎉 Pronto!

Agora o sistema vai:
- ✅ Verificar agendamentos expirados a cada 2 minutos
- ✅ Cancelar automaticamente agendamentos `pending_payment` após 15 minutos
- ✅ Enviar mensagem WhatsApp para o cliente
- ✅ Liberar o horário para novos agendamentos

