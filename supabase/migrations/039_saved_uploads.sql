-- Per-user saved community scans (one row per user_uploads image).
CREATE TABLE IF NOT EXISTS saved_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL REFERENCES user_uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, upload_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_uploads_user_id ON saved_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_uploads_upload_id ON saved_uploads(upload_id);

ALTER TABLE saved_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saved_uploads"
  ON saved_uploads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved_uploads"
  ON saved_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved_uploads"
  ON saved_uploads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
