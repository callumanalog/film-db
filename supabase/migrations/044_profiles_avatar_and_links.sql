-- Profile avatar (public URL in user-uploads bucket) and social / website links.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS website_url TEXT NULL;

COMMENT ON COLUMN public.profiles.avatar_url IS 'Public storage URL for profile photo; optional.';
COMMENT ON COLUMN public.profiles.instagram_url IS 'Canonical Instagram profile URL (https://www.instagram.com/{handle}).';
COMMENT ON COLUMN public.profiles.website_url IS 'User website; https URL stored after normalization.';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_avatar_url_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_url_length CHECK (
    avatar_url IS NULL OR char_length(avatar_url) <= 2048
  );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_instagram_url_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_instagram_url_length CHECK (
    instagram_url IS NULL OR char_length(instagram_url) <= 500
  );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_website_url_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_website_url_length CHECK (
    website_url IS NULL OR char_length(website_url) <= 500
  );
