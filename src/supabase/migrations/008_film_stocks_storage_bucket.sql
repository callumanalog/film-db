-- Create the film-stocks storage bucket for catalog images (film stock product images).
-- Run this in the Supabase SQL Editor, or via supabase db push, before uploading images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'film-stocks',
  'film-stocks',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read so image URLs work in the app
DROP POLICY IF EXISTS "Public read film-stocks" ON storage.objects;
CREATE POLICY "Public read film-stocks"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'film-stocks');

-- Allow service role (and optionally authenticated) to upload/update for the upload script
DROP POLICY IF EXISTS "Service role can manage film-stocks" ON storage.objects;
CREATE POLICY "Service role can manage film-stocks"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'film-stocks')
WITH CHECK (bucket_id = 'film-stocks');
