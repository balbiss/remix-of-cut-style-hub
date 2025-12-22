-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own logo
CREATE POLICY "Users can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Anyone can view logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated users to update their logos
CREATE POLICY "Users can update logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their logos
CREATE POLICY "Users can delete logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');