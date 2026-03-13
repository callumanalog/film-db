import { createClient } from "@/lib/supabase/server";
import type {
  FilmStock,
  FilmBrand,
  FilmType,
  FilmFormat,
  GrainFilter,
  ContrastFilter,
  LatitudeFilter,
  SaturationFilter,
  ShootingNote,
  ColorBalanceType,
  DevelopmentProcess,
  BestFor,
} from "@/lib/types";
import {
  scaleToGrainFilter,
  scaleToContrastFilter,
  scaleToLatitudeFilter,
  scaleToSaturationFilter,
} from "@/lib/types";
import type { FilmStockPurchaseLink } from "@/lib/types";

function parseScale1To5(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

function parseShootingNotes(value: unknown): ShootingNote[] {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      header: typeof item.header === "string" ? item.header : "",
      dek: typeof item.dek === "string" ? item.dek : "",
    }))
    .filter((n) => n.header !== "" || n.dek !== "");
}

function mapRowToBrand(row: Record<string, unknown>): FilmBrand {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logo_url: (row.logo_url as string) || null,
    description: (row.description as string) || null,
    website_url: (row.website_url as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapRowToStock(row: Record<string, unknown>, brand: FilmBrand): FilmStock & { brand: FilmBrand } {
  const format = Array.isArray(row.format) ? (row.format as FilmFormat[]) : [];
  const best_for = Array.isArray(row.best_for) ? (row.best_for as BestFor[]) : [];
  const grain = parseScale1To5(row.grain);
  const contrast = parseScale1To5(row.contrast);
  const latitude = parseScale1To5(row.latitude);
  const saturation = parseScale1To5(row.saturation);
  const shooting_notes = parseShootingNotes(row.shooting_notes);
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    brand_id: row.brand_id as string,
    format,
    type: row.type as FilmType,
    iso: Number(row.iso),
    description: (row.description as string) || null,
    history: (row.history as string) || null,
    shooting_notes,
    grain,
    contrast,
    latitude,
    saturation,
    color_balance: row.color_balance != null && String(row.color_balance).trim() !== "" ? String(row.color_balance).trim() : null,
    grain_level: scaleToGrainFilter(grain) ?? "medium",
    contrast_level: scaleToContrastFilter(contrast) ?? "balanced",
    latitude_level: scaleToLatitudeFilter(latitude),
    saturation_filter: scaleToSaturationFilter(saturation),
    color_balance_type: (row.color_balance_type as ColorBalanceType) || null,
    color_balance_kelvin: row.color_balance_kelvin != null ? Number(row.color_balance_kelvin) : null,
    dx_coding: Boolean(row.dx_coding),
    development_process: (row.development_process as DevelopmentProcess) || null,
    best_for,
    discontinued: Boolean(row.discontinued),
    price_tier: row.price_tier != null ? Number(row.price_tier) as 1 | 2 | 3 : null,
    base_price_usd: row.base_price_usd != null ? Number(row.base_price_usd) : null,
    image_url: (row.image_url as string) || null,
    year_introduced: row.year_introduced != null ? Number(row.year_introduced) : null,
    rating: row.rating != null ? Number(row.rating) : 0,
    featured: Boolean(row.featured),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    brand,
  };
}

export async function getBrandsFromSupabase(): Promise<FilmBrand[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("film_brands").select("*").order("name");
    if (error || !data || data.length === 0) return null;
    return data.map((row) => mapRowToBrand(row));
  } catch {
    return null;
  }
}

export async function getBrandBySlugFromSupabase(slug: string): Promise<FilmBrand | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("film_brands").select("*").eq("slug", slug).single();
    if (error || !data) return null;
    return mapRowToBrand(data);
  } catch {
    return null;
  }
}

export async function getFilmStocksFromSupabase(): Promise<(FilmStock & { brand: FilmBrand })[] | null> {
  try {
    const supabase = await createClient();
    const { data: brands, error: brandsError } = await supabase.from("film_brands").select("*");
    if (brandsError || !brands?.length) return null;
    const brandMap = new Map(brands.map((b) => [b.id, mapRowToBrand(b)]));
    const { data: stocks, error: stocksError } = await supabase.from("film_stocks").select("*");
    if (stocksError || !stocks?.length) return null;
    return stocks
      .map((row) => {
        const brand = brandMap.get(row.brand_id);
        if (!brand) return null;
        return mapRowToStock(row, brand);
      })
      .filter((s): s is FilmStock & { brand: FilmBrand } => s != null);
  } catch {
    return null;
  }
}

export async function getFilmStockBySlugFromSupabase(
  slug: string
): Promise<import("@/lib/types").FilmStockWithRelations | null> {
  try {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("film_stocks")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !row) return null;
    const { data: brandRow, error: brandErr } = await supabase
      .from("film_brands")
      .select("*")
      .eq("id", row.brand_id)
      .single();
    if (brandErr || !brandRow) return null;
    const stock = mapRowToStock(row, mapRowToBrand(brandRow));
    const { data: linkRows } = await supabase
      .from("film_stock_purchase_links")
      .select("*")
      .eq("film_stock_id", row.id);
    const purchase_links: FilmStockPurchaseLink[] = (linkRows ?? []).map((pl) => ({
      id: pl.id,
      film_stock_id: pl.film_stock_id,
      retailer_name: pl.retailer_name,
      url: pl.url,
      price_note: pl.price_note,
      created_at: pl.created_at,
    }));
    return {
      ...stock,
      purchase_links,
      sample_images: [],
    };
  } catch {
    return null;
  }
}
