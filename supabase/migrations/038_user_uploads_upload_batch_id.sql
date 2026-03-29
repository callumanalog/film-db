ALTER TABLE user_uploads
  ADD COLUMN IF NOT EXISTS upload_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_uploads_upload_batch_id ON user_uploads(upload_batch_id)
  WHERE upload_batch_id IS NOT NULL;

COMMENT ON COLUMN user_uploads.upload_batch_id IS 'Shared UUID for scans saved in one multi-file POST when review_id is null.';
