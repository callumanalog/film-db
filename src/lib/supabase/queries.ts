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

export interface FilmStockFilters {
  brand?: string;
  type?: FilmType;
  format?: FilmFormat;
  isoMin?: number;
  isoMax?: number;
  grain?: GrainLevel;
  contrast?: ContrastLevel;
  bestFor?: BestFor;
  discontinued?: boolean;
  search?: string;
}

function getAllBrands(): FilmBrand[] {
  return seedBrands;
}

function getAllFilmStocks(): (FilmStock & { brand: FilmBrand })[] {
  return seedFilmStocks.map((stock) => ({
    ...stock,
    brand: seedBrands.find((b) => b.id === stock.brand_id)!,
  }));
}

export async function getFilmStocks(
  filters?: FilmStockFilters
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  let stocks = getAllFilmStocks();

  if (filters) {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      stocks = stocks.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.brand.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    if (filters.brand) {
      stocks = stocks.filter(
        (s) => s.brand.slug === filters.brand
      );
    }
    if (filters.type) {
      stocks = stocks.filter((s) => s.type === filters.type);
    }
    if (filters.format) {
      stocks = stocks.filter((s) => s.format.includes(filters.format!));
    }
    if (filters.isoMin !== undefined) {
      stocks = stocks.filter((s) => s.iso >= filters.isoMin!);
    }
    if (filters.isoMax !== undefined) {
      stocks = stocks.filter((s) => s.iso <= filters.isoMax!);
    }
    if (filters.grain) {
      stocks = stocks.filter((s) => s.grain_level === filters.grain);
    }
    if (filters.contrast) {
      stocks = stocks.filter((s) => s.contrast_level === filters.contrast);
    }
    if (filters.bestFor) {
      stocks = stocks.filter((s) => s.best_for.includes(filters.bestFor!));
    }
    if (filters.discontinued !== undefined) {
      stocks = stocks.filter((s) => s.discontinued === filters.discontinued);
    }
  }

  stocks.sort((a, b) => {
    const keyA = `${a.brand.name} ${a.name}`.toLowerCase();
    const keyB = `${b.brand.name} ${b.name}`.toLowerCase();
    return keyA.localeCompare(keyB);
  });

  return stocks;
}

export async function getFilmStockBySlug(
  slug: string
): Promise<FilmStockWithRelations | null> {
  const stock = seedFilmStocks.find((s) => s.slug === slug);
  if (!stock) return null;

  const brand = seedBrands.find((b) => b.id === stock.brand_id)!;
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
  const stocks = getAllFilmStocks();
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
  const all = getAllFilmStocks();
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return TOP_RATED_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (s): s is FilmStock & { brand: FilmBrand } => s != null
  );
}

export async function getBrands(): Promise<FilmBrand[]> {
  return getAllBrands();
}

/** First 4 brands for the home page "Shop by Brand" section (Kodak, Fujifilm, Ilford, CineStill). */
export async function getTopBrands(): Promise<FilmBrand[]> {
  return getAllBrands().slice(0, 4);
}

export async function getBrandBySlug(
  slug: string
): Promise<FilmBrand | null> {
  return seedBrands.find((b) => b.slug === slug) || null;
}

export async function getFilmStocksByBrand(
  brandSlug: string
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  const stocks = getAllFilmStocks();
  return stocks.filter((s) => s.brand.slug === brandSlug);
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
  const allStocks = getAllFilmStocks();
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
