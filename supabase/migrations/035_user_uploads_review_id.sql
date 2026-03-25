-- Link community scans to the review they were submitted with (same POST as /api/user/reviews).
ALTER TABLE user_uploads
  ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_uploads_review_id ON user_uploads(review_id)
  WHERE review_id IS NOT NULL;

COMMENT ON COLUMN user_uploads.review_id IS 'When set, these scans belong to this review (same submission batch).';

-- Tighten INSERT: optional review_id must reference a review owned by the same user.
DROP POLICY IF EXISTS "Users can insert own user_uploads" ON user_uploads;

CREATE POLICY "Users can insert own user_uploads"
  ON user_uploads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      review_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.id = review_id AND r.user_id = auth.uid()
      )
    )
  );
