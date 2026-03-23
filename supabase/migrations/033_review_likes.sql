-- Likes on reviews (per-user, for counts, profile "Likes", and author visibility)
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes (for counts on public reviews)
CREATE POLICY "Anyone can read review_likes"
  ON review_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own review_likes"
  ON review_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review_likes"
  ON review_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Resolve liker display names for reviews you authored (profiles RLS is otherwise self-only)
CREATE OR REPLACE FUNCTION public.get_likers_for_authored_reviews(p_review_ids uuid[])
RETURNS TABLE(review_id uuid, display_name text, liker_user_id uuid, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT sub.review_id, sub.display_name, sub.liker_user_id, sub.created_at
  FROM (
    SELECT
      rl.review_id,
      COALESCE(p.display_name, 'Member')::text AS display_name,
      rl.user_id AS liker_user_id,
      rl.created_at,
      ROW_NUMBER() OVER (PARTITION BY rl.review_id ORDER BY rl.created_at ASC) AS rn
    FROM review_likes rl
    INNER JOIN reviews r ON r.id = rl.review_id AND r.user_id = auth.uid()
    LEFT JOIN profiles p ON p.id = rl.user_id
    WHERE rl.review_id = ANY(p_review_ids)
  ) sub
  WHERE sub.rn <= 20
  ORDER BY sub.review_id, sub.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_likers_for_authored_reviews(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_likers_for_authored_reviews(uuid[]) TO authenticated;
