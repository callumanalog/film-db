-- One UUID per submission: all rows from the same POST share this value (1–10 files).
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS upload_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_uploads_upload_batch_id ON user_uploads(upload_batch_id);

COMMENT ON COLUMN user_uploads.upload_batch_id IS 'Shared id for all images submitted in one request; NULL for legacy rows.';
