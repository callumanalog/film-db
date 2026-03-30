-- Optional friendly display name (Pinterest-style "Cal") separate from unique `display_name` handle.
-- Bio for profile; counts already on profiles from 042.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS bio TEXT NULL;

COMMENT ON COLUMN public.profiles.full_name IS 'Optional public display name; UI falls back to display_name when null.';
COMMENT ON COLUMN public.profiles.bio IS 'Optional short profile bio (max 160 chars).';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_bio_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 160);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_full_name_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length CHECK (
    full_name IS NULL OR char_length(trim(full_name)) <= 80
  );

-- UPDATE policy: ensure new row still belongs to the same user (Postgres RLS best practice).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
