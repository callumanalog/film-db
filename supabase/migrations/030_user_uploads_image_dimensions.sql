-- Store intrinsic dimensions for uploads (hero carousel landscape filter + future layout).
ALTER TABLE user_uploads
  ADD COLUMN IF NOT EXISTS image_width integer,
  ADD COLUMN IF NOT EXISTS image_height integer;

COMMENT ON COLUMN user_uploads.image_width IS 'Pixel width at upload time; used for hero carousel aspect filter.';
COMMENT ON COLUMN user_uploads.image_height IS 'Pixel height at upload time; used for hero carousel aspect filter.';
