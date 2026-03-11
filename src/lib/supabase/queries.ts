import type {
  FilmStock,
  FilmStockWithRelations,
  FilmBrand,
  FilmType,
  FilmFormat,
  GrainLevel,
  ContrastLevel,
  BestFor,
  FilmStockPurchaseLink,
  FilmStockSampleImage,
} from "@/lib/types";
import { seedBrands, seedFilmStocks, seedPurchaseLinks } from "@/lib/seed-data";
import { supabase } from "@/lib/supabase/client";

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

function useSupabase(): boolean {
  if (typeof process === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

type DbBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

type DbStock = {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  format: FilmFormat[];
  type: FilmType;
  iso: number;
  description: string | null;
  history: string | null;
  shooting_tips: string | null;
  grain: string | null;
  contrast: string | null;
  latitude: string | null;
  color_palette: string | null;
  discontinued: boolean;
  image_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  grain_level?: GrainLevel | null;
  contrast_level?: ContrastLevel | null;
  best_for?: BestFor[] | null;
  rating?: number | null;
  price_tier?: 1 | 2 | 3 | null;
  base_price_usd?: number | null;
};

type DbStockWithBrand = DbStock & { film_brands: DbBrand | null };

function mapDbBrand(row: DbBrand): FilmBrand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url,
    description: row.description,
    website_url: row.website_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDbStock(row: DbStockWithBrand, brand: FilmBrand): FilmStock & { brand: FilmBrand } {
  const s = row as DbStock;
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    brand_id: s.brand_id,
    format: s.format,
    type: s.type,
    iso: s.iso,
    description: s.description,
    history: s.history,
    shooting_tips: s.shooting_tips,
    grain: s.grain,
    contrast: s.contrast,
    latitude: s.latitude,
    color_palette: s.color_palette,
    grain_level: (s.grain_level as GrainLevel) ?? "medium",
    contrast_level: (s.contrast_level as ContrastLevel) ?? "medium",
    best_for: s.best_for ?? [],
    discontinued: s.discontinued,
    price_tier: s.price_tier ?? null,
    base_price_usd: s.base_price_usd ?? null,
    image_url: s.image_url,
    rating: Number(s.rating) ?? 0,
    featured: s.featured,
    created_at: s.created_at,
    updated_at: s.updated_at,
    brand,
  };
}

function mapDbPurchaseLink(row: {
  id: string;
  film_stock_id: string;
  retailer_name: string;
  url: string;
  price_note: string | null;
  created_at: string;
}): FilmStockPurchaseLink {
  return {
    id: row.id,
    film_stock_id: row.film_stock_id,
    retailer_name: row.retailer_name,
    url: row.url,
    price_note: row.price_note,
    created_at: row.created_at,
  };
}

function mapDbSampleImage(row: {
  id: string;
  film_stock_id: string;
  image_url: string;
  caption: string | null;
  camera_used: string | null;
  lens_used: string | null;
  settings: string | null;
  created_at: string;
}): FilmStockSampleImage {
  return {
    id: row.id,
    film_stock_id: row.film_stock_id,
    image_url: row.image_url,
    caption: row.caption,
    camera_used: row.camera_used,
    lens_used: row.lens_used,
    settings: row.settings,
    created_at: row.created_at,
  };
}

// --- Seed data path (when Supabase not configured) ---

function getAllBrandsSeed(): FilmBrand[] {
  return seedBrands;
}

function getAllFilmStocksSeed(): (FilmStock & { brand: FilmBrand })[] {
  return seedFilmStocks.map((stock) => ({
    ...stock,
    brand: seedBrands.find((b) => b.id === stock.brand_id)!,
  }));
}

// --- Supabase path ---

async function getAllBrandsSupabase(): Promise<FilmBrand[]> {
  const { data, error } = await supabase
    .from("film_brands")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapDbBrand);
}

async function getAllFilmStocksSupabase(): Promise<(FilmStock & { brand: FilmBrand })[]> {
  const { data, error } = await supabase
    .from("film_stocks")
    .select("*, film_brands!brand_id(*)")
    .order("featured", { ascending: false })
    .order("name");
  if (error) throw error;
  const brands = await getAllBrandsSupabase();
  const byId = new Map(brands.map((b) => [b.id, b]));
  return (data ?? []).map((row: DbStockWithBrand) => {
    const brand = row.film_brands ? mapDbBrand(row.film_brands) : byId.get(row.brand_id)!;
    return mapDbStock(row, brand);
  });
}

export async function getFilmStocks(
  filters?: FilmStockFilters
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  if (!useSupabase()) {
    let stocks = getAllFilmStocksSeed();
    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const words = q.split(/\s+/).filter(Boolean);
        stocks = stocks.filter((s) => {
          const searchable = [
            s.name,
            s.brand.name,
            s.description,
            s.grain,
            s.contrast,
            s.latitude,
            s.color_palette,
            s.shooting_tips,
            s.history,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
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
        return `${a.brand.name} ${a.name}`.toLowerCase().localeCompare(`${b.brand.name} ${b.name}`.toLowerCase());
      });
    } else {
      stocks.sort((a, b) =>
        `${a.brand.name} ${a.name}`.toLowerCase().localeCompare(`${b.brand.name} ${b.name}`.toLowerCase())
      );
    }
    return stocks;
  }

  // Supabase path: build query with filters where possible
  let query = supabase
    .from("film_stocks")
    .select("*, film_brands!brand_id(*)");

  if (filters?.brand !== undefined && filters.brand !== "") {
    const brandSlugs = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
    if (brandSlugs.length > 0) {
      const { data: brands } = await supabase
        .from("film_brands")
        .select("id")
        .in("slug", brandSlugs);
      const ids = (brands ?? []).map((b) => b.id);
      if (ids.length > 0) query = query.in("brand_id", ids);
    }
  }
  if (filters?.type !== undefined) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    if (types.length > 0) query = query.in("type", types);
  }
  if (filters?.format !== undefined) {
    const formats = Array.isArray(filters.format) ? filters.format : [filters.format];
    if (formats.length > 0) query = query.overlaps("format", formats);
  }
  if (filters?.iso !== undefined && filters.iso.length > 0) {
    query = query.in("iso", filters.iso);
  }
  if (filters?.isoMin !== undefined) {
    query = query.gte("iso", filters.isoMin);
  }
  if (filters?.isoMax !== undefined) {
    query = query.lte("iso", filters.isoMax);
  }
  if (filters?.discontinued !== undefined) {
    query = query.eq("discontinued", filters.discontinued);
  }

  const sortBy = filters?.sort ?? "popular";
  if (sortBy === "popular") {
    query = query
      .order("featured", { ascending: false })
      .order("name");
  } else {
    query = query.order("name");
  }

  const { data, error } = await query;
  if (error) throw error;

  const brands = await getAllBrandsSupabase();
  const byId = new Map(brands.map((b) => [b.id, b]));
  let stocks = (data ?? []).map((row: DbStockWithBrand) => {
    const brand = row.film_brands ? mapDbBrand(row.film_brands) : byId.get(row.brand_id)!;
    return mapDbStock(row, brand);
  });

  // In-memory filters not in DB or complex
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    stocks = stocks.filter((s) => {
      const searchable = [
        s.name,
        s.brand.name,
        s.description,
        s.grain,
        s.contrast,
        s.latitude,
        s.color_palette,
        s.shooting_tips,
        s.history,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return words.every((w) => searchable.includes(w));
    });
  }
  if (filters?.grain !== undefined) {
    const grains = Array.isArray(filters.grain) ? filters.grain : [filters.grain];
    if (grains.length > 0) {
      stocks = stocks.filter((s) => grains.includes(s.grain_level));
    }
  }
  if (filters?.contrast !== undefined) {
    const contrasts = Array.isArray(filters.contrast) ? filters.contrast : [filters.contrast];
    if (contrasts.length > 0) {
      stocks = stocks.filter((s) => contrasts.includes(s.contrast_level));
    }
  }
  if (filters?.bestFor !== undefined) {
    const bestFor = Array.isArray(filters.bestFor) ? filters.bestFor : [filters.bestFor];
    if (bestFor.length > 0) {
      stocks = stocks.filter((s) => bestFor.some((bf) => s.best_for.includes(bf)));
    }
  }

  if (sortBy === "popular") {
    stocks.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.rating !== b.rating) return b.rating - a.rating;
      return `${a.brand.name} ${a.name}`.toLowerCase().localeCompare(`${b.brand.name} ${b.name}`.toLowerCase());
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
  const stocks = useSupabase() ? await getAllFilmStocksSupabase() : getAllFilmStocksSeed();
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
  if (!useSupabase()) {
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

  const { data: stockRows, error: stockError } = await supabase
    .from("film_stocks")
    .select("*, film_brands!brand_id(*)")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (stockError) throw stockError;
  if (!stockRows) return null;

  const brand = (stockRows as DbStockWithBrand).film_brands
    ? mapDbBrand((stockRows as DbStockWithBrand).film_brands!)
    : (await supabase.from("film_brands").select("*").eq("id", (stockRows as DbStock).brand_id).single()).data;
  const brandMapped = brand ? mapDbBrand(brand as DbBrand) : null;
  if (!brandMapped) return null;

  const stock = mapDbStock(stockRows as DbStockWithBrand, brandMapped);

  const { data: links } = await supabase
    .from("film_stock_purchase_links")
    .select("*")
    .eq("film_stock_id", stock.id)
    .order("retailer_name");
  const { data: images } = await supabase
    .from("film_stock_sample_images")
    .select("*")
    .eq("film_stock_id", stock.id)
    .order("created_at", { ascending: false });

  return {
    ...stock,
    brand: brandMapped,
    purchase_links: (links ?? []).map(mapDbPurchaseLink),
    sample_images: (images ?? []).map(mapDbSampleImage),
  };
}

export async function getFeaturedFilmStocks(): Promise<
  (FilmStock & { brand: FilmBrand })[]
> {
  if (!useSupabase()) {
    return getAllFilmStocksSeed().filter((s) => s.featured);
  }
  const { data, error } = await supabase
    .from("film_stocks")
    .select("*, film_brands!brand_id(*)")
    .eq("featured", true)
    .order("name");
  if (error) throw error;
  const brands = await getAllBrandsSupabase();
  const byId = new Map(brands.map((b) => [b.id, b]));
  return (data ?? []).map((row: DbStockWithBrand) => {
    const brand = row.film_brands ? mapDbBrand(row.film_brands) : byId.get(row.brand_id)!;
    return mapDbStock(row, brand);
  });
}

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
  if (!useSupabase()) {
    const all = getAllFilmStocksSeed();
    const bySlug = new Map(all.map((s) => [s.slug, s]));
    return TOP_RATED_SLUGS.map((slug) => bySlug.get(slug)).filter(
      (s): s is FilmStock & { brand: FilmBrand } => s != null
    );
  }
  const all = await getAllFilmStocksSupabase();
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return TOP_RATED_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (s): s is FilmStock & { brand: FilmBrand } => s != null
  );
}

export async function getBrands(): Promise<FilmBrand[]> {
  if (!useSupabase()) return getAllBrandsSeed();
  return getAllBrandsSupabase();
}

export async function getTopBrands(): Promise<FilmBrand[]> {
  const brands = await getBrands();
  return brands.slice(0, 4);
}

export async function getBrandBySlug(
  slug: string
): Promise<FilmBrand | null> {
  if (!useSupabase()) {
    return seedBrands.find((b) => b.slug === slug) || null;
  }
  const { data, error } = await supabase
    .from("film_brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDbBrand(data as DbBrand) : null;
}

export async function getFilmStocksByBrand(
  brandSlug: string
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  return getFilmStocks({ brand: brandSlug, sort: "alphabetical" });
}

export async function getFilmStocksBySlugs(
  slugs: string[]
): Promise<(FilmStock & { brand: FilmBrand })[]> {
  if (slugs.length === 0) return [];
  if (!useSupabase()) {
    const all = getAllFilmStocksSeed();
    const bySlug = new Map(all.map((s) => [s.slug, s]));
    return slugs.map((slug) => bySlug.get(slug)).filter((s): s is FilmStock & { brand: FilmBrand } => s != null);
  }
  const all = await getAllFilmStocksSupabase();
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return slugs.map((slug) => bySlug.get(slug)).filter((s): s is FilmStock & { brand: FilmBrand } => s != null);
}

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
  const allStocks = useSupabase() ? await getAllFilmStocksSupabase() : getAllFilmStocksSeed();
  const candidates = allStocks.filter(
    (s) => s.id !== stock.id && s.type === stock.type
  );

  if (candidates.length <= limit) {
    return candidates;
  }

  const isoLog = Math.log2(Math.max(stock.iso, 1));
  const scored = candidates.map((s) => {
    const isoDiff = Math.abs(Math.log2(Math.max(s.iso, 1)) - isoLog);
    const isoScore = 1 / (1 + isoDiff);
    const formatOverlap = s.format.some((f) => stock.format.includes(f)) ? 0.3 : 0;
    const bestForOverlap =
      stock.best_for?.length && s.best_for?.length
        ? s.best_for.filter((bf) => stock.best_for!.includes(bf)).length * 0.15
        : 0;
    return { stock: s, score: isoScore + formatOverlap + bestForOverlap };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ stock: s }) => s);
}
