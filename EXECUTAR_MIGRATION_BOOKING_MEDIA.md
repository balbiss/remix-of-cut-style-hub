# Executar Migração: Adicionar Campos de Mídia na Página de Agendamento

Esta migração adiciona campos na tabela `tenants` para permitir que o dono personalize a página de agendamento com imagens e vídeos.

## O que esta migração faz:

1. Adiciona campos na tabela `tenants`:
   - `hero_image_url` - URL da imagem principal
   - `hero_video_url` - URL do vídeo principal (YouTube/Vimeo)
   - `gallery_images` - Array JSON de URLs de imagens para galeria
   - `hero_title` - Título personalizado
   - `hero_subtitle` - Subtítulo personalizado

2. Cria um novo bucket de storage `booking-media` para armazenar imagens e vídeos

3. Configura políticas de acesso para o bucket (público para leitura, autenticado para escrita)

## Como executar:

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/20251227000000_add_booking_page_media.sql`
4. Copie e cole o conteúdo no editor SQL
5. Clique em **Run** para executar

### Opção 2: Via CLI do Supabase

```bash
cd remix-of-cut-style-hub
npx supabase db push
```

## Verificação:

Após executar a migração, verifique se os campos foram adicionados:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN ('hero_image_url', 'hero_video_url', 'gallery_images', 'hero_title', 'hero_subtitle');
```

## Como usar:

1. Acesse o painel admin: `/admin/configuracoes`
2. Clique na aba **"Página"**
3. Configure:
   - Título e subtítulo personalizados
   - Imagem principal (upload)
   - Vídeo do YouTube/Vimeo (URL)
   - Galeria de imagens (múltiplas imagens)

## Notas:

- As imagens são armazenadas no bucket `booking-media` do Supabase Storage
- Vídeos devem ser URLs do YouTube ou Vimeo (não upload direto)
- Tamanho máximo por imagem: 5MB
- A página de agendamento exibirá automaticamente as mídias configuradas


