-- Display metadata for brand detail pages (film-style header meta row).
alter table public.film_brands
  add column if not exists founded_year integer null,
  add column if not exists country text null;

comment on column public.film_brands.founded_year is 'Year the company was founded (brand page meta).';
comment on column public.film_brands.country is 'Country of origin (brand page meta).';

update public.film_brands
set founded_year = 1888,
    country = 'United States'
where slug = 'kodak';
