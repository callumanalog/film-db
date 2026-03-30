-- Discover, Community, and lightbox resolve uploader display_name via profiles.
-- Existing policy only allows SELECT where auth.uid() = id, so without the service
-- role key, fetchDisplayNamesByUserIds() falls back to the anon/session client and
-- returns no rows for other users → UI shows "Member".
-- This policy allows any client to read profile rows for public attribution.
-- Application code must continue using .select('id', 'display_name') only for batch name resolution.

CREATE POLICY "Public can read profiles for display names"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
