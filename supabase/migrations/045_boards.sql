-- User boards and membership via saved_uploads (many boards per scan).

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT boards_name_nonempty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_boards_user_updated ON boards(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS board_items (
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  saved_upload_id UUID NOT NULL REFERENCES saved_uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, saved_upload_id)
);

CREATE INDEX IF NOT EXISTS idx_board_items_board ON board_items(board_id);
CREATE INDEX IF NOT EXISTS idx_board_items_saved ON board_items(saved_upload_id);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own boards"
  ON boards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own boards"
  ON boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own boards"
  ON boards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own boards"
  ON boards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read board_items on own boards"
  ON board_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM boards b WHERE b.id = board_id AND b.user_id = auth.uid())
  );

CREATE POLICY "Users insert board_items own board and save"
  ON board_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM boards b
      INNER JOIN saved_uploads su ON su.id = saved_upload_id
      WHERE b.id = board_id
        AND b.user_id = auth.uid()
        AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete board_items on own boards"
  ON board_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM boards b WHERE b.id = board_id AND b.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_board_updated_at_from_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE boards SET updated_at = now() WHERE id = NEW.board_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE boards SET updated_at = now() WHERE id = OLD.board_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_board_items_touch_board ON board_items;
CREATE TRIGGER tr_board_items_touch_board
  AFTER INSERT OR DELETE ON board_items
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_board_updated_at_from_item();

CREATE OR REPLACE FUNCTION public.set_boards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_boards_updated_at ON boards;
CREATE TRIGGER tr_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_boards_updated_at();

-- Summaries for profile (cover = latest item with an image); SECURITY INVOKER uses RLS.
CREATE OR REPLACE FUNCTION public.board_summaries_for_user()
RETURNS TABLE (
  board_id UUID,
  board_name TEXT,
  board_description TEXT,
  updated_at TIMESTAMPTZ,
  item_count BIGINT,
  cover_url TEXT
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
      LIMIT 1
    )
  FROM boards b
  WHERE b.user_id = auth.uid()
  ORDER BY b.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.board_summaries_for_user() TO authenticated;
