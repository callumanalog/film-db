-- Brand page display metadata: founded_year, country, logo_url (same-origin SVGs under /public/brands/).
-- Logo SVGs are simple wordmark placeholders in the repo; replace with official artwork when licensed.
-- ztest slug intentionally omitted.

-- Columns are introduced in 064; repeat here so this file is safe if 064 was skipped (e.g. SQL editor only).
alter table public.film_brands
  add column if not exists founded_year integer null,
  add column if not exists country text null;

comment on column public.film_brands.founded_year is 'Year the company was founded (brand page meta).';
comment on column public.film_brands.country is 'Country of origin (brand page meta).';

-- Kodak (year/country may already be set by 064; logo path aligned to .svg in public/brands/)
UPDATE public.film_brands
SET
  founded_year = 1888,
  country = 'United States',
  logo_url = '/brands/kodak.svg',
  updated_at = now()
WHERE slug = 'kodak';

-- Fujifilm: Fuji Photo Film origins 1934, Japan
UPDATE public.film_brands
SET
  founded_year = 1934,
  country = 'Japan',
  logo_url = '/brands/fujifilm.svg',
  updated_at = now()
WHERE slug = 'fujifilm';

-- Ilford Photo (Harman), company roots 1879, UK
UPDATE public.film_brands
SET
  founded_year = 1879,
  country = 'United Kingdom',
  logo_url = '/brands/ilford.svg',
  updated_at = now()
WHERE slug = 'ilford';

-- CineStill Inc., USA, est. 2012
UPDATE public.film_brands
SET
  founded_year = 2012,
  country = 'United States',
  logo_url = '/brands/cinestill.svg',
  updated_at = now()
WHERE slug = 'cinestill';

-- Lomography: Vienna collective / company 1992, Austria
UPDATE public.film_brands
SET
  founded_year = 1992,
  country = 'Austria',
  logo_url = '/brands/lomography.svg',
  updated_at = now()
WHERE slug = 'lomography';

-- Foma Bohemia: photographic materials from 1921, Czech Republic
UPDATE public.film_brands
SET
  founded_year = 1921,
  country = 'Czech Republic',
  logo_url = '/brands/foma.svg',
  updated_at = now()
WHERE slug = 'foma';

-- Rollei (Franke & Heidecke camera brand 1920; current analog film line Germany)
UPDATE public.film_brands
SET
  founded_year = 1920,
  country = 'Germany',
  logo_url = '/brands/rollei.svg',
  updated_at = now()
WHERE slug = 'rollei';

-- ADOX brand (original 1860 Germany; current production Germany)
UPDATE public.film_brands
SET
  founded_year = 1860,
  country = 'Germany',
  logo_url = '/brands/adox.svg',
  updated_at = now()
WHERE slug = 'adox';

-- Kentmere Ltd origins ~1891, UK (now Harman / Ilford family)
UPDATE public.film_brands
SET
  founded_year = 1891,
  country = 'United Kingdom',
  logo_url = '/brands/kentmere.svg',
  updated_at = now()
WHERE slug = 'kentmere';

-- Bergger, France 1996
UPDATE public.film_brands
SET
  founded_year = 1996,
  country = 'France',
  logo_url = '/brands/bergger.svg',
  updated_at = now()
WHERE slug = 'bergger';

-- Agfa brand (Agfa-Gevaert photographic division roots 1867, Germany)
UPDATE public.film_brands
SET
  founded_year = 1867,
  country = 'Germany',
  logo_url = '/brands/agfa.svg',
  updated_at = now()
WHERE slug = 'agfa';

-- Japan Camera Hunter / JCH (StreetPan etc.; blog-to-brand ~2009, founder UK-based)
UPDATE public.film_brands
SET
  founded_year = 2009,
  country = 'United Kingdom',
  logo_url = '/brands/jch.svg',
  updated_at = now()
WHERE slug = 'jch';

-- Film Washi (Lomig Perrotin, France 2013)
UPDATE public.film_brands
SET
  founded_year = 2013,
  country = 'France',
  logo_url = '/brands/washi.svg',
  updated_at = now()
WHERE slug = 'washi';

-- Silberra (Saint Petersburg artisan brand, ~2018)
UPDATE public.film_brands
SET
  founded_year = 2018,
  country = 'Russia',
  logo_url = '/brands/silberra.svg',
  updated_at = now()
WHERE slug = 'silberra';

-- ORWO / Wolfen film works (East German successor to Agfa Wolfen plant, 1909 predecessor works)
UPDATE public.film_brands
SET
  founded_year = 1909,
  country = 'Germany',
  logo_url = '/brands/orwo.svg',
  updated_at = now()
WHERE slug = 'orwo';

-- Harman Technology (Ilford parent; Mobberley site since 1928)
UPDATE public.film_brands
SET
  founded_year = 1928,
  country = 'United Kingdom',
  logo_url = '/brands/harman.svg',
  updated_at = now()
WHERE slug = 'harman';

-- Dubblefilm, Barcelona 2015
UPDATE public.film_brands
SET
  founded_year = 2015,
  country = 'Spain',
  logo_url = '/brands/dubblefilm.svg',
  updated_at = now()
WHERE slug = 'dubblefilm';

-- Revolog, Vienna 2010
UPDATE public.film_brands
SET
  founded_year = 2010,
  country = 'Austria',
  logo_url = '/brands/revolog.svg',
  updated_at = now()
WHERE slug = 'revolog';

-- Street Candy film (repackaged stocks; brand activity from ~2017, verify HQ)
UPDATE public.film_brands
SET
  founded_year = 2017,
  country = 'United Kingdom',
  logo_url = '/brands/street-candy.svg',
  updated_at = now()
WHERE slug = 'street-candy';

-- Film Ferrania S.p.A. (original Ferrania works 1923, Italy; revival project from 2014)
UPDATE public.film_brands
SET
  founded_year = 1923,
  country = 'Italy',
  logo_url = '/brands/ferrania.svg',
  updated_at = now()
WHERE slug = 'ferrania';

-- Kosmo Foto (Kickstarter / brand launch 2018, UK)
UPDATE public.film_brands
SET
  founded_year = 2018,
  country = 'United Kingdom',
  logo_url = '/brands/kosmo-foto.svg',
  updated_at = now()
WHERE slug = 'kosmo-foto';

-- Lucky Film (Chinese state-linked manufacturer; mid-20th century scale-up — approximate founding year)
UPDATE public.film_brands
SET
  founded_year = 1958,
  country = 'China',
  logo_url = '/brands/lucky.svg',
  updated_at = now()
WHERE slug = 'lucky';

-- Optional: verify after apply
-- SELECT slug, founded_year, country, logo_url IS NOT NULL AS has_logo FROM public.film_brands ORDER BY slug;
