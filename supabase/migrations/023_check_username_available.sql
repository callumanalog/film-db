-- Check if a display_name (username) is available (not already used).
-- Callable by anon so sign-up page can check before submitting.
CREATE OR REPLACE FUNCTION public.check_username_available(p_display_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(TRIM(display_name)) = LOWER(TRIM(NULLIF(p_display_name, '')))
      AND display_name IS NOT NULL
      AND TRIM(display_name) != ''
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;
