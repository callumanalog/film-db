-- Per-user likes on community uploads (user_uploads rows). Mirrors review_likes pattern.
CREATE TABLE IF NOT EXISTS upload_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES user_uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (upload_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_upload_likes_upload_id ON upload_likes(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_likes_user_id ON upload_likes(user_id);

ALTER TABLE upload_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read upload_likes"
  ON upload_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own upload_likes"
  ON upload_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own upload_likes"
  ON upload_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Denormalized counts (maintained by triggers; readable on public user_uploads rows).
ALTER TABLE user_uploads
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  ADD COLUMN IF NOT EXISTS save_count INTEGER NOT NULL DEFAULT 0 CHECK (save_count >= 0);

COMMENT ON COLUMN user_uploads.like_count IS 'Number of upload_likes rows for this upload; kept in sync by trigger.';
COMMENT ON COLUMN user_uploads.save_count IS 'Number of saved_uploads rows for this upload; kept in sync by trigger.';

-- Backfill save_count from existing saved_uploads (before triggers).
UPDATE user_uploads u
SET save_count = s.cnt
FROM (
  SELECT upload_id, COUNT(*)::integer AS cnt
  FROM saved_uploads
  GROUP BY upload_id
) s
WHERE u.id = s.upload_id;

CREATE OR REPLACE FUNCTION public.bump_user_upload_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_uploads SET like_count = like_count + 1 WHERE id = NEW.upload_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_uploads SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.upload_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_user_upload_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_uploads SET save_count = save_count + 1 WHERE id = NEW.upload_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_uploads SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.upload_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_upload_likes_bump_count ON upload_likes;
CREATE TRIGGER tr_upload_likes_bump_count
  AFTER INSERT OR DELETE ON upload_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_user_upload_like_count();

DROP TRIGGER IF EXISTS tr_saved_uploads_bump_count ON saved_uploads;
CREATE TRIGGER tr_saved_uploads_bump_count
  AFTER INSERT OR DELETE ON saved_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_user_upload_save_count();
