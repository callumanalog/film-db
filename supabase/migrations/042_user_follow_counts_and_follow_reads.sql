-- Follow graph already lives in user_follows (034). This migration adds:
--   - Denormalized follower/following counts on profiles (for UI without heavy aggregates)
--   - Triggers to keep counts in sync
--   - RLS so clients can read the follow graph (needed for “who follows whom” beyond self-outgoing rows)

-- ---------------------------------------------------------------------------
-- Profiles: counts (readable with existing public profile SELECT policies)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followers_count INTEGER NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
  ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0 CHECK (following_count >= 0);

COMMENT ON COLUMN public.profiles.followers_count IS 'Rows in user_follows where following_id = profiles.id; maintained by trigger.';
COMMENT ON COLUMN public.profiles.following_count IS 'Rows in user_follows where follower_id = profiles.id; maintained by trigger.';

-- Backfill from existing user_follows
UPDATE public.profiles p
SET following_count = s.cnt
FROM (
  SELECT follower_id, COUNT(*)::integer AS cnt
  FROM public.user_follows
  GROUP BY follower_id
) s
WHERE p.id = s.follower_id;

UPDATE public.profiles p
SET followers_count = s.cnt
FROM (
  SELECT following_id, COUNT(*)::integer AS cnt
  FROM public.user_follows
  GROUP BY following_id
) s
WHERE p.id = s.following_id;

CREATE OR REPLACE FUNCTION public.bump_profile_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_user_follows_bump_counts ON public.user_follows;
CREATE TRIGGER tr_user_follows_bump_counts
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_profile_follow_counts();

-- ---------------------------------------------------------------------------
-- RLS: allow reading the follow graph (insert/delete still “own” follower only)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own follows" ON public.user_follows;

CREATE POLICY "Anyone can read user_follows"
  ON public.user_follows FOR SELECT
  USING (true);
