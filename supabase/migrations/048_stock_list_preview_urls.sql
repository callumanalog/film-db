-- Replace single cover with up to 5 ordered preview image URLs per list (RPC return shape change).

DROP FUNCTION IF EXISTS public.stock_list_summaries_for_user();

CREATE OR REPLACE FUNCTION public.stock_list_summaries_for_user()
RETURNS TABLE (
  list_id UUID,
  list_title TEXT,
  updated_at TIMESTAMPTZ,
  item_count BIGINT,
  preview_urls TEXT[]
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    sl.id AS list_id,
    sl.title AS list_title,
    sl.updated_at AS updated_at,
    (SELECT COUNT(*)::bigint FROM stock_list_items sli WHERE sli.list_id = sl.id) AS item_count,
    COALESCE(
      (
        SELECT array_agg(t.image_url ORDER BY t.sort_order ASC)
        FROM (
          SELECT sli2.sort_order, fs.image_url::text
          FROM stock_list_items sli2
          LEFT JOIN film_stocks fs ON fs.slug = sli2.film_stock_slug
          WHERE sli2.list_id = sl.id
          ORDER BY sli2.sort_order ASC
          LIMIT 5
        ) t
      ),
      ARRAY[]::text[]
    ) AS preview_urls
  FROM stock_lists sl
  WHERE sl.user_id = auth.uid()
  ORDER BY sl.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.stock_list_summaries_for_user() TO authenticated;
