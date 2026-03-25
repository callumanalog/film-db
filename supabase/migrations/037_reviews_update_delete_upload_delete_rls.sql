-- Allow authors to update/delete their own reviews (edit + delete flows).
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to delete their own uploads (e.g. remove scans when deleting a review).
DROP POLICY IF EXISTS "Users can delete own user_uploads" ON public.user_uploads;
CREATE POLICY "Users can delete own user_uploads"
  ON public.user_uploads FOR DELETE
  USING (auth.uid() = user_id);
