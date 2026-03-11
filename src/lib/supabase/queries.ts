import type {
  FilmStock,
  FilmStockWithRelations,
  FilmBrand,
  FilmType,
  FilmFormat,
  GrainLevel,
  ContrastLevel,
  BestFor,
} from "@/lib/types";
import { seedBrands, seedFilmStocks, seedPurchaseLinks } from "@/lib/seed-data";
import { getFilmStocksFromFile } from "@/lib/editable-film-stocks";
import { getBrandsFromFile } from "@/lib/editable-brands";
import {
  getBrandsFromSupabase,
  getBrandBySlugFromSupabase,
  getFilmStocksFromSupabase,
  getFilmStockBySlugFromSupabase,
} from "@/lib/supabase/catalog";

export interface FilmStockFilters {
  search?: string;
  brand?: string | string[];
  type?: FilmType | FilmType[];
  format?: FilmFormat | FilmFormat[];
  iso?: number[];
  isoMin?: number;
  isoMax?: number;
  grain?: GrainLevel | GrainLevel[];
  contrast?: ContrastLevel | ContrastLevel[];
  bestFor?: BestFor | BestFor[];
  discontinued?: boolean;
  /** "popular" (default) = by featured then rating then name; "alphabetical" = by brand + name */
  sort?: "popular" | "alphabetical";
}

function getAllBrands(): FilmBrand[] {
  return getBrandsFromFile() ?? seedBrands;
}

function getAllFilmStocks(): (FilmStock & { brand: FilmBrand })[] {
  const brands = getAllBrands();
  const stocks = getFilmStocksFromFile() ?? seedFilmStocks;
  return stocks
    .map((stock) => {
      const brand = brands.find((b) => b.id === stock.brand_id);
      if (!brand) {
        if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
          console.warn(`[film-db] Film stock "${stock.name}" (id: ${stock.id}) has missing brand_id: ${stock.brand_id}. Skipping.`);
        }
        return null;
      }
      return { ...stock, brand };
    })
    .filter((s): s is FilmStock & { brand: FilmBrand } => s != null);
}

async function getAllFilmStocksMaybeFromSupabase(): Promise<(FilmStock & { brand: FilmBrand })[]> {
  const fromSupabase = await getFilmStocksFromSupabase();
  if (fromSupabase && fromSupabase.length > 0) return fromSupabase;
  return getAllFilmStocks();
}

export async function getFilmStocks(
  filters?: FilmStockFilters
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  let stocks = await getAllFilmStocksMaybeFromSupabase();

  if (filters) {
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const words = q.split(/\s+/).filter(Boolean);
      stocks = stocks.filter((s) => {
        const searchable = [s.name, s.brand.name].join(" ").toLowerCase();
        return words.every((w) => searchable.includes(w));
      });
    }
    if (filters.brand !== undefined && filters.brand !== "") {
      const brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      if (brands.length > 0) {
        stocks = stocks.filter((s) => brands.includes(s.brand.slug));
      }
    }
    if (filters.type !== undefined) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      if (types.length > 0) {
        stocks = stocks.filter((s) => types.includes(s.type));
      }
    }
    if (filters.format !== undefined) {
      const formats = Array.isArray(filters.format) ? filters.format : [filters.format];
      if (formats.length > 0) {
        stocks = stocks.filter((s) => formats.some((f) => s.format.includes(f)));
      }
    }
    if (filters.iso !== undefined && filters.iso.length > 0) {
      const isoSet = new Set(filters.iso);
      stocks = stocks.filter((s) => isoSet.has(s.iso));
    }
    if (filters.isoMin !== undefined) {
      stocks = stocks.filter((s) => s.iso >= filters.isoMin!);
    }
    if (filters.isoMax !== undefined) {
      stocks = stocks.filter((s) => s.iso <= filters.isoMax!);
    }
    if (filters.grain !== undefined) {
      const grains = Array.isArray(filters.grain) ? filters.grain : [filters.grain];
      if (grains.length > 0) {
        stocks = stocks.filter((s) => grains.includes(s.grain_level));
      }
    }
    if (filters.contrast !== undefined) {
      const contrasts = Array.isArray(filters.contrast) ? filters.contrast : [filters.contrast];
      if (contrasts.length > 0) {
        stocks = stocks.filter((s) => contrasts.includes(s.contrast_level));
      }
    }
    if (filters.bestFor !== undefined) {
      const bestFor = Array.isArray(filters.bestFor) ? filters.bestFor : [filters.bestFor];
      if (bestFor.length > 0) {
        stocks = stocks.filter((s) => bestFor.some((bf) => s.best_for.includes(bf)));
      }
    }
    if (filters.discontinued !== undefined) {
      stocks = stocks.filter((s) => s.discontinued === filters.discontinued);
    }
  }

  const sortBy = filters?.sort ?? "popular";
  if (sortBy === "popular") {
    stocks.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.rating !== b.rating) return b.rating - a.rating;
      const keyA = `${a.brand.name} ${a.name}`.toLowerCase();
      const keyB = `${b.brand.name} ${b.name}`.toLowerCase();
      return keyA.localeCompare(keyB);
    });
  } else {
    stocks.sort((a, b) => {
      const keyA = `${a.brand.name} ${a.name}`.toLowerCase();
      const keyB = `${b.brand.name} ${b.name}`.toLowerCase();
      return keyA.localeCompare(keyB);
    });
  }

  return stocks;
}

export interface FilmFilterOptions {
  types: FilmType[];
  isos: number[];
  formats: FilmFormat[];
  grains: GrainLevel[];
  contrasts: ContrastLevel[];
  bestFor: BestFor[];
}

/** Desired display order for filter dropdowns (only include types that exist in data). */
const TYPE_ORDER: FilmType[] = [
  "color_negative",
  "bw_negative",
  "color_reversal",
  "bw_reversal",
  "instant",
];
const FORMAT_ORDER: FilmFormat[] = ["35mm", "120", "4x5", "8x10", "110", "instant"];
const GRAIN_ORDER: GrainLevel[] = ["fine", "medium", "strong"];
const CONTRAST_ORDER: ContrastLevel[] = ["low", "medium", "high"];

function sortByOrder<T>(arr: T[], order: T[]): T[] {
  return [...arr].sort((a, b) => {
    const i = order.indexOf(a);
    const j = order.indexOf(b);
    if (i === -1 && j === -1) return 0;
    if (i === -1) return 1;
    if (j === -1) return -1;
    return i - j;
  });
}

export async function getFilmFilterOptions(): Promise<FilmFilterOptions> {
  const stocks = await getAllFilmStocksMaybeFromSupabase();
  const types = sortByOrder(
    [...new Set(stocks.map((s) => s.type))],
    TYPE_ORDER
  );
  const isos = [...new Set(stocks.map((s) => s.iso))].sort((a, b) => a - b);
  const formats = sortByOrder(
    [...new Set(stocks.flatMap((s) => s.format))],
    FORMAT_ORDER
  );
  const grains = sortByOrder(
    [...new Set(stocks.map((s) => s.grain_level))],
    GRAIN_ORDER
  );
  const contrasts = sortByOrder(
    [...new Set(stocks.map((s) => s.contrast_level))],
    CONTRAST_ORDER
  );
  const bestFor = [...new Set(stocks.flatMap((s) => s.best_for))].sort();
  return { types, isos, formats, grains, contrasts, bestFor };
}

export async function getFilmStockBySlug(
  slug: string
): Promise<FilmStockWithRelations | null> {
  const fromSupabase = await getFilmStockBySlugFromSupabase(slug);
  if (fromSupabase) return fromSupabase;

  const stocks = getFilmStocksFromFile() ?? seedFilmStocks;
  const stock = stocks.find((s) => s.slug === slug);
  if (!stock) return null;

  const brands = getAllBrands();
  const brand = brands.find((b) => b.id === stock.brand_id);
  if (!brand) {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn(`[film-db] Film stock "${stock.name}" (slug: ${slug}) has missing brand_id: ${stock.brand_id}.`);
    }
    return null;
  }

  const purchase_links = seedPurchaseLinks.filter(
    (pl) => pl.film_stock_id === stock.id
  );

  return {
    ...stock,
    brand,
    purchase_links,
    sample_images: [],
  };
}

export async function getFeaturedFilmStocks(): Promise<
  (FilmStock & { brand: FilmBrand })[]
> {
  const stocks = await getAllFilmStocksMaybeFromSupabase();
  return stocks.filter((s) => s.featured);
}

/** Fixed set of 6 "top rated" film stocks for the homepage carousel, in display order. */
const TOP_RATED_SLUGS = [
  "kodak-portra-400",
  "kodak-gold-200",
  "kodak-ektar-100",
  "kodak-tri-x-400",
  "cinestill-800t",
  "fujifilm-velvia-100",
] as const;

export async function getTopRatedFilmStocks(): Promise<
  (FilmStock & { brand: FilmBrand })[]
> {
  const all = await getAllFilmStocksMaybeFromSupabase();
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return TOP_RATED_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (s): s is FilmStock & { brand: FilmBrand } => s != null
  );
}

export async function getBrands(): Promise<FilmBrand[]> {
  const fromSupabase = await getBrandsFromSupabase();
  if (fromSupabase && fromSupabase.length > 0) return fromSupabase;
  return getAllBrands();
}

/** First 4 brands for the home page "Shop by Brand" section (Kodak, Fujifilm, Ilford, CineStill). */
export async function getTopBrands(): Promise<FilmBrand[]> {
  const brands = await getBrands();
  return brands.slice(0, 4);
}

export async function getBrandBySlug(
  slug: string
): Promise<FilmBrand | null> {
  const fromSupabase = await getBrandBySlugFromSupabase(slug);
  if (fromSupabase) return fromSupabase;
  return getAllBrands().find((b) => b.slug === slug) || null;
}

export async function getFilmStocksByBrand(
  brandSlug: string
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  const stocks = await getAllFilmStocksMaybeFromSupabase();
  return stocks.filter((s) => s.brand.slug === brandSlug);
}

/** Return stocks for the given slugs; order matches slug order; missing slugs omitted. */
export async function getFilmStocksBySlugs(
  slugs: string[]
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  const all = await getAllFilmStocksMaybeFromSupabase();
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return slugs.map((slug) => bySlug.get(slug)).filter((s): s is FilmStock & { brand: FilmBrand } => s != null);
}

/** Up to `limit` other stocks from the same brand, excluding the given stock. For "More from [Brand]" recirculation. */
export async function getMoreFromBrand(
  stock: FilmStock & { brand: FilmBrand },
  limit = 6
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  const byBrand = await getFilmStocksByBrand(stock.brand.slug);
  return byBrand.filter((s) => s.id !== stock.id).slice(0, limit);
}

export async function getRelatedStocks(
  stock: FilmStock,
  limit = 6
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  const allStocks = await getAllFilmStocksMaybeFromSupabase();
  const candidates = allStocks.filter(
    (s) => s.id !== stock.id && s.type === stock.type
  );

  if (candidates.length <= limit) {
    return candidates;
  }

  // Score by: similar ISO (log scale), shared format, overlapping best_for
  const isoLog = Math.log2(Math.max(stock.iso, 1));
  const scored = candidates.map((s) => {
    const isoDiff = Math.abs(Math.log2(Math.max(s.iso, 1)) - isoLog);
    const isoScore = 1 / (1 + isoDiff); // 1 = same ISO, lower for further away
    const formatOverlap = s.format.some((f) => stock.format.includes(f))
      ? 0.3
      : 0;
    const bestForOverlap =
      stock.best_for?.length && s.best_for?.length
        ? s.best_for.filter((bf) => stock.best_for!.includes(bf)).length * 0.15
        : 0;
    return {
      stock: s,
      score: isoScore + formatOverlap + bestForOverlap,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ stock: s }) => s);
}
