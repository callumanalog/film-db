-- Extra cover URLs for profile board preview collage (3+ images).
-- PG cannot change RETURNS TABLE shape with CREATE OR REPLACE; drop first.

DROP FUNCTION IF EXISTS public.board_summaries_for_user();

CREATE FUNCTION public.board_summaries_for_user()
RETURNS TABLE (
  board_id UUID,
  board_name TEXT,
  board_description TEXT,
  updated_at TIMESTAMPTZ,
  item_count BIGINT,
  cover_url TEXT,
  cover_url_2 TEXT,
  cover_url_3 TEXT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    b.id,
    b.name,
    b.description,
    b.updated_at,
    (SELECT COUNT(*)::bigint FROM board_items bi WHERE bi.board_id = b.id),
    (
      SELECT u.image_url::text
      FROM board_items bi2
      INNER JOIN saved_uploads su ON su.id = bi2.saved_upload_id
      INNER JOIN user_uploads u ON u.id = su.upload_id
      WHERE bi2.board_id = b.id
        AND u.image_url IS NOT NULL
        AND length(trim(u.image_url)) > 0
      ORDER BY bi2.created_at DESC
      LIMIT 1 OFFSET 0
    ),
    (
      SELECT u.image_url::text
      FROM board_items bi2
      INNER JOIN saved_uploads su ON su.id = bi2.saved_upload_id
      INNER JOIN user_uploads u ON u.id = su.upload_id
      WHERE bi2.board_id = b.id
        AND u.image_url IS NOT NULL
        AND length(trim(u.image_url)) > 0
      ORDER BY bi2.created_at DESC
      LIMIT 1 OFFSET 1
    ),
    (
      SELECT u.image_url::text
      FROM board_items bi2
      INNER JOIN saved_uploads su ON su.id = bi2.saved_upload_id
      INNER JOIN user_uploads u ON u.id = su.upload_id
      WHERE bi2.board_id = b.id
        AND u.image_url IS NOT NULL
        AND length(trim(u.image_url)) > 0
      ORDER BY bi2.created_at DESC
      LIMIT 1 OFFSET 2
    )
  FROM boards b
  WHERE b.user_id = auth.uid()
  ORDER BY b.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.board_summaries_for_user() TO authenticated;
