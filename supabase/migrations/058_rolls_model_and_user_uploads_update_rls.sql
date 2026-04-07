-- First-class rolls model + user_uploads UPDATE policy.

-- 1) Ensure owners can update their own uploads metadata.
DROP POLICY IF EXISTS "Users can update own user_uploads" ON public.user_uploads;
CREATE POLICY "Users can update own user_uploads"
  ON public.user_uploads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) Create canonical rolls table for roll-level editable metadata.
CREATE TABLE IF NOT EXISTS public.rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  review_id UUID NULL REFERENCES public.reviews(id) ON DELETE SET NULL,
  title TEXT NULL,
  caption TEXT NULL,
  camera TEXT NULL,
  shot_iso TEXT NULL,
  lens TEXT NULL,
  lab TEXT NULL,
  scanner TEXT NULL,
  push_pull TEXT NULL,
  format TEXT NULL,
  location TEXT NULL,
  shot_date DATE NULL,
  tags TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rolls_user_id ON public.rolls(user_id);
CREATE INDEX IF NOT EXISTS idx_rolls_film_stock_slug ON public.rolls(film_stock_slug);
CREATE INDEX IF NOT EXISTS idx_rolls_review_id ON public.rolls(review_id);

ALTER TABLE public.rolls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own rolls" ON public.rolls;
CREATE POLICY "Users can read own rolls"
  ON public.rolls FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own rolls" ON public.rolls;
CREATE POLICY "Users can insert own rolls"
  ON public.rolls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own rolls" ON public.rolls;
CREATE POLICY "Users can update own rolls"
  ON public.rolls FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own rolls" ON public.rolls;
CREATE POLICY "Users can delete own rolls"
  ON public.rolls FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Add roll_id to user_uploads and backfill from existing grouping.
ALTER TABLE public.user_uploads
  ADD COLUMN IF NOT EXISTS roll_id UUID NULL REFERENCES public.rolls(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_uploads_roll_id ON public.user_uploads(roll_id);

WITH upload_groups AS (
  SELECT
    u.user_id,
    u.film_stock_slug,
    u.review_id,
    u.upload_batch_id,
    MIN(u.created_at) AS created_at,
    MAX(r.review_title) AS title,
    MAX(u.caption) AS caption,
    MAX(u.camera) AS camera,
    MAX(u.shot_iso) AS shot_iso,
    MAX(u.lens) AS lens,
    MAX(u.lab) AS lab,
    MAX(u.scanner) AS scanner,
    MAX(u.push_pull) AS push_pull,
    MAX(u.format) AS format,
    MAX(u.location) AS location,
    MAX(u.shot_date) AS shot_date,
    MAX(u.tags) AS tags
  FROM public.user_uploads u
  LEFT JOIN public.reviews r ON r.id = u.review_id
  WHERE u.roll_id IS NULL
  GROUP BY u.user_id, u.film_stock_slug, u.review_id, u.upload_batch_id
),
inserted_rolls AS (
  INSERT INTO public.rolls (
    user_id,
    film_stock_slug,
    review_id,
    title,
    caption,
    camera,
    shot_iso,
    lens,
    lab,
    scanner,
    push_pull,
    format,
    location,
    shot_date,
    tags,
    created_at,
    updated_at
  )
  SELECT
    g.user_id,
    g.film_stock_slug,
    g.review_id,
    g.title,
    g.caption,
    g.camera,
    g.shot_iso,
    g.lens,
    g.lab,
    g.scanner,
    g.push_pull,
    g.format,
    g.location,
    g.shot_date,
    g.tags,
    COALESCE(g.created_at, now()),
    now()
  FROM upload_groups g
  RETURNING id, user_id, film_stock_slug, review_id
)
UPDATE public.user_uploads u
SET roll_id = ir.id
FROM inserted_rolls ir
WHERE u.roll_id IS NULL
  AND u.user_id = ir.user_id
  AND u.film_stock_slug = ir.film_stock_slug
  AND (
    (u.review_id IS NOT DISTINCT FROM ir.review_id)
    OR (u.review_id IS NULL AND u.upload_batch_id IS NULL AND ir.review_id IS NULL)
  );
