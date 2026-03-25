-- Storage bucket + RLS for review/community image uploads (API route uses bucket id `user-uploads`).
-- Apply this if you only ran root `supabase/migrations` and skipped `src/supabase/migrations/006_*`.
-- Also raises file_size_limit to 50MB to match the app client (was 5MB in 006).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated uploads only under {user_uuid}/...
DROP POLICY IF EXISTS "Users can upload to own folder in user-uploads" ON storage.objects;
CREATE POLICY "Users can upload to own folder in user-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Overwrites (upload with upsert) need UPDATE on the same path prefix
DROP POLICY IF EXISTS "Users can update own folder in user-uploads" ON storage.objects;
CREATE POLICY "Users can update own folder in user-uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Public read user-uploads" ON storage.objects;
CREATE POLICY "Public read user-uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-uploads');
