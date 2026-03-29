-- Per-scan metadata from the upload flow (format tab, location field).
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN user_uploads.format IS 'Film format chosen at upload (e.g. 35mm, 120).';
COMMENT ON COLUMN user_uploads.location IS 'Shoot location text entered with the upload.';
