-- Reviews table: add columns used by the API (user_id already exists from 003)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS film_stock_slug TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_title TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS camera TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS iso TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS push_pull TEXT;

-- user_uploads: add columns used by the API
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS film_stock_slug TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS caption TEXT;

-- Allow anyone to read all reviews (so "Everyone" tab can show community reviews)
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);

-- No change to user_uploads RLS (read/insert own from 003)
