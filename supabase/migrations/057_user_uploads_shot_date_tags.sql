-- Optional shoot date and free-form tags for user uploads (share-roll flow).
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS shot_date DATE;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS tags TEXT;

COMMENT ON COLUMN user_uploads.shot_date IS 'When the photos were shot (optional; YYYY-MM-DD).';
COMMENT ON COLUMN user_uploads.tags IS 'Comma-separated tags for search and display.';
