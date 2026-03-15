-- Pending user state: track whether the user has verified their email.
-- Sign-up creates the profile with email_verified_at = NULL; after they click
-- the verification link, the auth callback sets email_verified_at = now().

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.email_verified_at IS 'Set when the user confirms their email via the verification link; NULL = pending.';

-- Ensure new profiles get display_name from sign-up metadata (we send display_name in options.data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email_verified_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      ''
    ),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
