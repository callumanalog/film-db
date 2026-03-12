-- Create the user-uploads storage bucket (required for uploads from the review/upload modal).
-- Run this in the Supabase SQL Editor if you haven't created the bucket via the Dashboard.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow authenticated users to upload only into their own folder (path: {user_id}/{film_slug}/...)
DROP POLICY IF EXISTS "Users can upload to own folder in user-uploads" ON storage.objects;
CREATE POLICY "Users can upload to own folder in user-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Allow anyone to read from user-uploads (so public image URLs work)
DROP POLICY IF EXISTS "Public read user-uploads" ON storage.objects;
CREATE POLICY "Public read user-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');
