-- Replace old URL base with new one across all tables that store URLs.
-- Run in Supabase SQL Editor after replacing the placeholders.
--
-- 1. Set your OLD base URL (e.g. https://old-project-ref.supabase.co or full storage path)
-- 2. Set your NEW base URL (e.g. https://new-project-ref.supabase.co or your CDN/domain)
--
-- Example: if you moved from project ABC to XYZ:
--   OLD: https://abcdefgh.supabase.co
--   NEW: https://xyzsupabase.supabase.co

-- Option A: Use a variable (run as a single script in SQL Editor)
-- Replace the two values below, then run the whole file.

DO $$
DECLARE
  old_base TEXT := 'https://OLD_PROJECT_REF.supabase.co';  -- e.g. https://abcdefgh.supabase.co
  new_base TEXT := 'https://NEW_PROJECT_REF.supabase.co'; -- e.g. https://xyzsupabase.supabase.co
  updated_count INT;
BEGIN
  -- film_brands: logo_url, website_url
  UPDATE film_brands
  SET logo_url = REPLACE(logo_url, old_base, new_base)
  WHERE logo_url IS NOT NULL AND logo_url LIKE old_base || '%';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'film_brands.logo_url: % rows updated', updated_count;

  UPDATE film_brands
  SET website_url = REPLACE(website_url, old_base, new_base)
  WHERE website_url IS NOT NULL AND website_url LIKE old_base || '%';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'film_brands.website_url: % rows updated', updated_count;

  -- film_stocks: image_url
  UPDATE film_stocks
  SET image_url = REPLACE(image_url, old_base, new_base)
  WHERE image_url IS NOT NULL AND image_url LIKE old_base || '%';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'film_stocks.image_url: % rows updated', updated_count;

  -- film_stock_purchase_links: url
  UPDATE film_stock_purchase_links
  SET url = REPLACE(url, old_base, new_base)
  WHERE url LIKE old_base || '%';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'film_stock_purchase_links.url: % rows updated', updated_count;

  -- film_stock_sample_images: image_url
  UPDATE film_stock_sample_images
  SET image_url = REPLACE(image_url, old_base, new_base)
  WHERE image_url LIKE old_base || '%';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'film_stock_sample_images.image_url: % rows updated', updated_count;

  -- user_uploads: image_url (storage URLs for community shots)
  UPDATE user_uploads
  SET image_url = REPLACE(image_url, old_base, new_base)
  WHERE image_url IS NOT NULL AND image_url LIKE old_base || '%';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'user_uploads.image_url: % rows updated', updated_count;
END $$;

-- ---------------------------------------------------------------------------
-- Option B: Standalone UPDATEs (replace OLD_BASE and NEW_BASE in each, run as needed)
-- ---------------------------------------------------------------------------
/*
UPDATE film_brands   SET logo_url   = REPLACE(logo_url,   'OLD_BASE', 'NEW_BASE') WHERE logo_url   IS NOT NULL AND logo_url   LIKE 'OLD_BASE%';
UPDATE film_brands   SET website_url= REPLACE(website_url,'OLD_BASE', 'NEW_BASE') WHERE website_url IS NOT NULL AND website_url LIKE 'OLD_BASE%';
UPDATE film_stocks   SET image_url  = REPLACE(image_url,  'OLD_BASE', 'NEW_BASE') WHERE image_url  IS NOT NULL AND image_url  LIKE 'OLD_BASE%';
UPDATE film_stock_purchase_links SET url = REPLACE(url, 'OLD_BASE', 'NEW_BASE') WHERE url LIKE 'OLD_BASE%';
UPDATE film_stock_sample_images  SET image_url = REPLACE(image_url, 'OLD_BASE', 'NEW_BASE') WHERE image_url LIKE 'OLD_BASE%';
UPDATE user_uploads  SET image_url  = REPLACE(image_url,  'OLD_BASE', 'NEW_BASE') WHERE image_url  IS NOT NULL AND image_url  LIKE 'OLD_BASE%';
*/
