CREATE TABLE film_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE film_format AS ENUM ('35mm', '120', '4x5', '8x10', '110', 'instant');
CREATE TYPE film_type AS ENUM ('color_negative', 'color_reversal', 'bw_negative', 'bw_reversal', 'instant');

CREATE TABLE film_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand_id UUID NOT NULL REFERENCES film_brands(id) ON DELETE CASCADE,
  format film_format[] NOT NULL DEFAULT '{35mm}',
  type film_type NOT NULL,
  iso INTEGER NOT NULL,
  description TEXT,
  history TEXT,
  shooting_tips TEXT,
  grain TEXT,
  contrast TEXT,
  latitude TEXT,
  color_palette TEXT,
  discontinued BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE film_stock_purchase_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_stock_id UUID NOT NULL REFERENCES film_stocks(id) ON DELETE CASCADE,
  retailer_name TEXT NOT NULL,
  url TEXT NOT NULL,
  price_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE film_stock_sample_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_stock_id UUID NOT NULL REFERENCES film_stocks(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  camera_used TEXT,
  lens_used TEXT,
  settings TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_film_stocks_brand ON film_stocks(brand_id);
CREATE INDEX idx_film_stocks_type ON film_stocks(type);
CREATE INDEX idx_film_stocks_iso ON film_stocks(iso);
CREATE INDEX idx_film_stocks_slug ON film_stocks(slug);
CREATE INDEX idx_film_brands_slug ON film_brands(slug);
CREATE INDEX idx_purchase_links_stock ON film_stock_purchase_links(film_stock_id);
CREATE INDEX idx_sample_images_stock ON film_stock_sample_images(film_stock_id);
