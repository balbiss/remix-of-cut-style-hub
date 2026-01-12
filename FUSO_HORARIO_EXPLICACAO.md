# 🕐 Como o Fuso Horário Funciona no Sistema

## ✅ Tudo Está Configurado Corretamente!

O sistema está usando **UTC (Coordinated Universal Time)** para armazenar e comparar datas, que é a forma correta e padrão. O horário de Brasília (UTC-3) é automaticamente convertido.

---

## 📊 Como Funciona

### 1. **Frontend (Navegador do Cliente)**
- Quando o cliente está no Brasil, o navegador usa o horário de Brasília automaticamente
- `new Date()` retorna a data/hora no fuso horário local do navegador
- `toISOString()` converte para UTC antes de enviar ao servidor
- **Exemplo:** Se são 15:00 em Brasília, o navegador envia `18:00 UTC` (15:00 + 3 horas)

### 2. **Banco de Dados (Supabase)**
- Todas as datas são armazenadas em **UTC**
- Isso garante consistência independente do fuso horário do servidor
- **Exemplo:** `2025-12-22T18:00:00.000Z` (UTC) = `2025-12-22T15:00:00` (Brasília)

### 3. **Edge Function (Cancelamento)**
- Usa `new Date().toISOString()` que retorna UTC
- Compara com `tolerance_expires_at` que também está em UTC
- **Resultado:** A comparação é sempre correta, independente do fuso horário

### 4. **Cron Job (pg_cron)**
- Executa no servidor do Supabase (provavelmente em UTC)
- Chama a Edge Function que faz a comparação em UTC
- **Resultado:** Funciona corretamente mesmo que o servidor esteja em UTC

---

## ✅ Por Que Isso Está Correto?

1. **Consistência:** Todas as comparações são feitas em UTC
2. **Precisão:** Não há problemas de conversão entre fusos horários
3. **Padrão:** É assim que sistemas modernos funcionam (armazenam em UTC, exibem no fuso local)

---

## 🔍 Exemplo Prático

### Cenário: Cliente em Brasília cria agendamento às 15:00

1. **Cliente cria PIX às 15:00 (Brasília)**
   - Navegador: `new Date()` = `2025-12-22T15:00:00` (horário local)
   - Enviado ao banco: `2025-12-22T18:00:00.000Z` (UTC)

2. **Expiração calculada: 15 minutos depois**
   - Navegador: `15:00 + 15 min = 15:15` (Brasília)
   - Enviado ao banco: `2025-12-22T18:15:00.000Z` (UTC)

3. **Cron Job verifica às 15:16 (Brasília)**
   - Servidor: `new Date().toISOString()` = `2025-12-22T18:16:00.000Z` (UTC)
   - Comparação: `18:16 > 18:15` ✅ **Expirado!**
   - Cancela e envia mensagem

---

## 🎯 Conclusão

**Não precisa fazer nada!** O sistema já está funcionando corretamente com o fuso horário de Brasília. As conversões são automáticas:

- ✅ Cliente vê horário de Brasília no navegador
- ✅ Sistema armazena em UTC (padrão)
- ✅ Comparações são feitas em UTC (precisas)
- ✅ Mensagens são enviadas no horário correto

---

## 📝 Logs Adicionados

Adicionei logs que mostram o horário de Brasília para facilitar o debug:

- Na Edge Function: mostra quando verifica e processa agendamentos
- No Frontend: mostra quando cria a reserva e quando expira

Você pode ver esses logs no console do navegador e nos logs da Edge Function no Supabase Dashboard.






