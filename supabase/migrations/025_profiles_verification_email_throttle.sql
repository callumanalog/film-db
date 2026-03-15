-- Throttle verification emails: only allow one per 60 seconds per user.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_email_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.verification_email_sent_at IS 'Last time a verification email was sent; used to throttle to once per 60 seconds.';
