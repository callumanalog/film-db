-- Role for access control: only 'filumbycallum' is admin; all new sign-ups are 'user'.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

COMMENT ON COLUMN public.profiles.role IS 'Access role: user (default for all sign-ups) or admin. Only filumbycallum is admin.';

-- Grant admin only to the filumbycallum profile (by display_name)
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(TRIM(display_name)) = 'filumbycallum';

-- Ensure all other existing profiles are user (in case default was not applied)
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR role NOT IN ('user', 'admin');

-- New sign-ups always get role = 'user' (trigger below)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, email_verified_at, role)
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
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
