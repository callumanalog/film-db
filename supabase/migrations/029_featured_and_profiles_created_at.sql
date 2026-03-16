-- Featured stocks: show in mobile search "Trending Searches". Others NULL.
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NULL;

-- Ensure column allows NULL (in case it already existed with NOT NULL)
ALTER TABLE film_stocks
  ALTER COLUMN featured DROP NOT NULL;

UPDATE film_stocks
SET featured = true
WHERE slug IN (
  'kodak-gold-200',
  'cinestill-800t',
  'ilford-delta-3200',
  'kodak-ektar-100',
  'kodak-portra-160'
);

UPDATE film_stocks
SET featured = NULL
WHERE featured IS NOT TRUE;

COMMENT ON COLUMN film_stocks.featured IS 'When true, stock appears in mobile search Trending Searches. NULL for others.';

-- Featured brands: show in mobile search "Trending brands". Others NULL.
ALTER TABLE film_brands
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NULL;

-- Ensure column allows NULL (in case it already existed with NOT NULL)
ALTER TABLE film_brands
  ALTER COLUMN featured DROP NOT NULL;

UPDATE film_brands
SET featured = true
WHERE slug IN (
  'kodak',
  'fujifilm',
  'cinestill',
  'ilford',
  'harman',
  'kentmere'
);

UPDATE film_brands
SET featured = NULL
WHERE featured IS NOT TRUE;

COMMENT ON COLUMN film_brands.featured IS 'When true, brand appears in mobile search Trending brands. NULL for others.';

-- Profiles created_at: set when user taps "Create account" (profile row created by trigger).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NULL;

-- Backfill existing profiles from auth.users.created_at
UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id AND p.created_at IS NULL;

-- Default for new rows (trigger-created)
ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT now();

COMMENT ON COLUMN public.profiles.created_at IS 'When the user created their account (profile row created).';

-- Ensure new sign-ups get created_at (include in trigger so it is set on insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, email_verified_at, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      ''
    ),
    NEW.email,
    NULL,
    'user',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
