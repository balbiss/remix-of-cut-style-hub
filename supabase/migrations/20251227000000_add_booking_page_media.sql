-- Add media fields to tenants table for booking page customization
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_video_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;

-- Create storage bucket for booking page media (images/videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-media', 'booking-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload booking media
CREATE POLICY "Users can upload booking media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'booking-media' 
  AND auth.role() = 'authenticated'
);

-- Allow anyone to view booking media (public bucket)
CREATE POLICY "Anyone can view booking media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'booking-media');

-- Allow authenticated users to update their booking media
CREATE POLICY "Users can update booking media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'booking-media' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their booking media
CREATE POLICY "Users can delete booking media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'booking-media' AND auth.role() = 'authenticated');

-- Add comment to explain the fields
COMMENT ON COLUMN public.tenants.hero_image_url IS 'URL da imagem principal da página de agendamento';
COMMENT ON COLUMN public.tenants.hero_video_url IS 'URL do vídeo principal (YouTube, Vimeo ou arquivo)';
COMMENT ON COLUMN public.tenants.gallery_images IS 'Array JSON de URLs de imagens para galeria';
COMMENT ON COLUMN public.tenants.hero_title IS 'Título personalizado da página de agendamento';
COMMENT ON COLUMN public.tenants.hero_subtitle IS 'Subtítulo personalizado da página de agendamento';


