-- Public film stock lists (curated stocks per user), bookmarks, and ordered items.

CREATE TABLE IF NOT EXISTS stock_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_lists_title_nonempty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT stock_lists_tags_max_10 CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10)
);

CREATE INDEX IF NOT EXISTS idx_stock_lists_user_updated ON stock_lists(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS stock_list_items (
  list_id UUID NOT NULL REFERENCES stock_lists(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL REFERENCES film_stocks(slug) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (list_id, film_stock_slug),
  CONSTRAINT stock_list_items_sort_unique UNIQUE (list_id, sort_order),
  CONSTRAINT stock_list_items_sort_nonneg CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_stock_list_items_slug ON stock_list_items(film_stock_slug);
CREATE INDEX IF NOT EXISTS idx_stock_list_items_list ON stock_list_items(list_id);

CREATE TABLE IF NOT EXISTS saved_stock_lists (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES stock_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, list_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_stock_lists_list ON saved_stock_lists(list_id);

-- PostgreSQL does not allow subqueries in CHECK constraints; use a trigger instead.
CREATE OR REPLACE FUNCTION public.enforce_saved_stock_lists_not_own()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT sl.user_id INTO owner_id FROM stock_lists sl WHERE sl.id = NEW.list_id;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'List not found' USING ERRCODE = '23503';
  END IF;
  IF owner_id = NEW.user_id THEN
    RAISE EXCEPTION 'Cannot save your own list'
      USING ERRCODE = '23514',
            CONSTRAINT = 'saved_stock_lists_not_own';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_saved_stock_lists_not_own ON saved_stock_lists;
CREATE TRIGGER tr_saved_stock_lists_not_own
  BEFORE INSERT ON saved_stock_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_saved_stock_lists_not_own();

ALTER TABLE stock_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_stock_lists ENABLE ROW LEVEL SECURITY;

-- Lists: public read; owners write.
CREATE POLICY "Anyone can read stock_lists"
  ON stock_lists FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users insert own stock_lists"
  ON stock_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stock_lists"
  ON stock_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own stock_lists"
  ON stock_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Items: public read; list owners write.
CREATE POLICY "Anyone can read stock_list_items"
  ON stock_list_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners insert stock_list_items"
  ON stock_list_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM stock_lists sl WHERE sl.id = list_id AND sl.user_id = auth.uid())
  );

CREATE POLICY "Owners update stock_list_items"
  ON stock_list_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM stock_lists sl WHERE sl.id = list_id AND sl.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stock_lists sl WHERE sl.id = list_id AND sl.user_id = auth.uid())
  );

CREATE POLICY "Owners delete stock_list_items"
  ON stock_list_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM stock_lists sl WHERE sl.id = list_id AND sl.user_id = auth.uid())
  );

-- Saved lists: own rows only; cannot save own lists (CHECK on table).
CREATE POLICY "Users read own saved_stock_lists"
  ON saved_stock_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert saved_stock_lists"
  ON saved_stock_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved_stock_lists"
  ON saved_stock_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_stock_list_updated_at_from_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stock_lists SET updated_at = now() WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE stock_lists SET updated_at = now() WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stock_lists SET updated_at = now() WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_stock_list_items_touch_list ON stock_list_items;
CREATE TRIGGER tr_stock_list_items_touch_list
  AFTER INSERT OR UPDATE OR DELETE ON stock_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_stock_list_updated_at_from_item();

CREATE OR REPLACE FUNCTION public.set_stock_lists_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_stock_lists_updated_at ON stock_lists;
CREATE TRIGGER tr_stock_lists_updated_at
  BEFORE UPDATE ON stock_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.set_stock_lists_updated_at();

CREATE OR REPLACE FUNCTION public.stock_list_summaries_for_user()
RETURNS TABLE (
  list_id UUID,
  list_title TEXT,
  updated_at TIMESTAMPTZ,
  item_count BIGINT,
  cover_url TEXT
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
    (
      SELECT fs.image_url::text
      FROM stock_list_items sli2
      INNER JOIN film_stocks fs ON fs.slug = sli2.film_stock_slug
      WHERE sli2.list_id = sl.id
        AND fs.image_url IS NOT NULL
        AND length(trim(fs.image_url)) > 0
      ORDER BY sli2.sort_order ASC
      LIMIT 1
    ) AS cover_url
  FROM stock_lists sl
  WHERE sl.user_id = auth.uid()
  ORDER BY sl.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.stock_list_summaries_for_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.stock_lists_containing_film(p_slug text, p_limit int)
RETURNS TABLE (
  list_id UUID,
  list_title TEXT,
  updated_at TIMESTAMPTZ,
  owner_user_id UUID
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    sl.id AS list_id,
    sl.title AS list_title,
    sl.updated_at AS updated_at,
    sl.user_id AS owner_user_id
  FROM stock_lists sl
  WHERE EXISTS (
    SELECT 1
    FROM stock_list_items sli
    WHERE sli.list_id = sl.id AND sli.film_stock_slug = p_slug
  )
  ORDER BY sl.updated_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.stock_lists_containing_film(text, int) TO anon, authenticated;
