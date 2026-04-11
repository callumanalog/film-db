-- Optional link from film brand rows to camera catalog brand slug(s) for /cameras?brand=…
alter table public.film_brands
  add column if not exists related_camera_brand_slugs text[] default '{}';

comment on column public.film_brands.related_camera_brand_slugs is
  'Camera brand slugs (seed camera_brands) for cross-nav; empty uses app defaults in film-brand-camera-brand-slugs.ts';
