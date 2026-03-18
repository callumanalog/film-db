"use server";

import { getFilmStocks, getBrands, getFeaturedFilmStocks, getFeaturedBrands } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import { getAllCommunityUploadsForGallery } from "@/app/actions/uploads";
import { createClient } from "@/lib/supabase/server";

export type SearchTab = "stocks" | "shots" | "notes" | "brands" | "users";

function stockToSearchResult(s: { slug: string; name: string; iso?: number | null; type?: string; format?: string[] | null; brand?: { name: string } | null; image_url?: string | null }): SearchStocksResult {
  return {
    slug: s.slug,
    name: s.name,
    iso: s.iso ?? null,
    type: s.type ?? undefined,
    format: s.format ?? undefined,
    brandName: s.brand?.name ?? "",
    imageUrl: s.image_url ?? null,
  };
}

export interface SearchStocksResult {
  slug: string;
  name: string;
  iso?: number | null;
  type?: string;
  format?: string[];
  brandName: string;
  imageUrl?: string | null;
}

export interface SearchBrandsResult {
  slug: string;
  name: string;
  subMeta: string;
}

export interface SearchShotsResult {
  id: string;
  stockSlug: string;
  stockName: string;
  brandName: string;
  imageUrl: string | null;
  username: string;
}

export interface SearchNotesResult {
  id: string;
  film_stock_slug: string;
  review_title: string | null;
  rating: number | null;
  stockName?: string;
}

export interface SearchUsersResult {
  id: string;
  display_name: string | null;
  handle?: string | null;
}

export interface SearchResult {
  stocks?: SearchStocksResult[];
  brands?: SearchBrandsResult[];
  shots?: SearchShotsResult[];
  notes?: SearchNotesResult[];
  users?: SearchUsersResult[];
}

/** Tab-aware search: returns only the active tab's results. */
export async function searchFilmsByTab(
  query: string,
  tab: SearchTab
): Promise<SearchResult> {
  const q = query?.trim() ?? "";
  if (!q) return { [tab]: [] };

  switch (tab) {
    case "stocks": {
      const stocks = await getFilmStocks({ search: q, sort: "alphabetical" });
      return { stocks: stocks.map(stockToSearchResult) };
    }
    case "brands": {
      const [brands, allStocks] = await Promise.all([getBrands(), getFilmStocks({ sort: "alphabetical" })]);
      const lower = q.toLowerCase();
      const brandSlugsWithMatchingStock = new Set(
        allStocks.filter((s) => s.name.toLowerCase().includes(lower)).map((s) => s.brand.slug)
      );
      const filtered = brands.filter(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          (b.slug && b.slug.toLowerCase().includes(lower)) ||
          brandSlugsWithMatchingStock.has(b.slug)
      );
      return {
        brands: filtered.map((b) => ({
          slug: b.slug,
          name: b.name,
          subMeta: "Brand",
        })),
      };
    }
    case "shots": {
      const stocks = await getFilmStocks({ sort: "alphabetical" });
      const matchingStockSlugs = new Set(
        stocks.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).map((s) => s.slug)
      );
      const uploadsByText = await getAllCommunityUploadsForGallery(stocks, q);
      const uploadsByStockName =
        matchingStockSlugs.size > 0
          ? await getAllCommunityUploadsForGallery(stocks, undefined, [...matchingStockSlugs])
          : [];
      const seenIds = new Set(uploadsByText.map((u) => u.id));
      const merged = [...uploadsByText];
      for (const u of uploadsByStockName) {
        if (!seenIds.has(u.id)) {
          seenIds.add(u.id);
          merged.push(u);
        }
      }
      merged.sort((a, b) => 0); // keep order stable (uploadsByText first, then by stock name)
      return {
        shots: merged.map((u) => ({
          id: u.id,
          stockSlug: u.stockSlug,
          stockName: u.stockName,
          brandName: u.brandName,
          imageUrl: u.imageUrl,
          username: u.username,
        })),
      };
    }
    case "notes": {
      const supabase = await createClient();
      const pattern = `%${q}%`;
      const { data: rows, error } = await supabase
        .from("reviews")
        .select("id, film_stock_slug, review_title, rating")
        .or(`review_title.ilike.${pattern},review_text.ilike.${pattern},film_stock_slug.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error || !rows?.length) return { notes: [] };
      const slugs = [...new Set((rows as { film_stock_slug: string }[]).map((r) => r.film_stock_slug))];
      const stocks = await getFilmStocks({ sort: "alphabetical" });
      const nameBySlug = new Map(stocks.map((s) => [s.slug, s.name]));
      return {
        notes: (rows as { id: string; film_stock_slug: string; review_title: string | null; rating: number | null }[]).map((r) => ({
          id: r.id,
          film_stock_slug: r.film_stock_slug,
          review_title: r.review_title,
          rating: r.rating,
          stockName: nameBySlug.get(r.film_stock_slug),
        })),
      };
    }
    case "users": {
      const supabase = await createClient();
      const pattern = `%${q}%`;
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", pattern)
        .limit(50);
      if (error || !profiles?.length) return { users: [] };
      return {
        users: (profiles as { id: string; display_name: string | null }[]).map((p) => ({
          id: p.id,
          display_name: p.display_name ?? null,
          handle: p.display_name ? `@${p.display_name.replace(/\s+/g, "_").toLowerCase()}` : null,
        })),
      };
    }
    default:
      return {};
  }
}

const LATEST_SHOTS_LIMIT = 10;
const LATEST_NOTES_LIMIT = 10;
const LATEST_USERS_LIMIT = 10;

/** Trending stocks for mobile search empty state (Stocks tab). */
export async function getTrendingStocks(): Promise<SearchStocksResult[]> {
  const stocks = await getFeaturedFilmStocks();
  return stocks.map(stockToSearchResult);
}

/** Trending brands for mobile search empty state (Brands tab). */
export async function getTrendingBrands(): Promise<SearchBrandsResult[]> {
  const brands = await getFeaturedBrands();
  return brands.map((b) => ({
    slug: b.slug,
    name: b.name,
    subMeta: "Brand",
  }));
}

/** Latest shots for mobile search empty state (Shots tab). Limit 10. */
export async function getLatestShots(): Promise<SearchShotsResult[]> {
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const uploads = await getAllCommunityUploadsForGallery(stocks);
  return uploads.slice(0, LATEST_SHOTS_LIMIT).map((u) => ({
    id: u.id,
    stockSlug: u.stockSlug,
    stockName: u.stockName,
    brandName: u.brandName,
    imageUrl: u.imageUrl,
    username: u.username,
  }));
}

/** Latest notes (reviews) for mobile search empty state (Notes tab). Limit 10. */
export async function getLatestNotes(): Promise<SearchNotesResult[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, film_stock_slug, review_title, rating")
    .order("created_at", { ascending: false })
    .limit(LATEST_NOTES_LIMIT);
  if (error || !rows?.length) return [];
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const nameBySlug = new Map(stocks.map((s) => [s.slug, s.name]));
  return (rows as { id: string; film_stock_slug: string; review_title: string | null; rating: number | null }[]).map(
    (r) => ({
      id: r.id,
      film_stock_slug: r.film_stock_slug,
      review_title: r.review_title,
      rating: r.rating,
      stockName: nameBySlug.get(r.film_stock_slug),
    })
  );
}

/** Latest users (profiles) for mobile search empty state (Users tab). Limit 10. Order by created_at desc. */
export async function getLatestUsers(): Promise<SearchUsersResult[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("created_at", { ascending: false })
    .limit(LATEST_USERS_LIMIT);
  if (error || !profiles?.length) return [];
  return (profiles as { id: string; display_name: string | null }[]).map((p) => ({
    id: p.id,
    display_name: p.display_name ?? null,
    handle: p.display_name ? `@${p.display_name.replace(/\s+/g, "_").toLowerCase()}` : null,
  }));
}

export interface SuggestedStocksResult {
  label: string;
  stocks: SearchStocksResult[];
  /** Full stock catalog for instant client-side filtering. */
  allStocks: SearchStocksResult[];
}

/**
 * Returns 5 suggested film stocks for the drawer search empty state,
 * plus the complete stock list for instant client-side filtering.
 * Signed-in users with logged rolls → most recently logged (unique by slug).
 * Otherwise → top 5 by avg user rating (popular/trending).
 */
export async function getSuggestedStocks(): Promise<SuggestedStocksResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const allStocks = await getFilmStocks({ sort: "alphabetical" });
  const allMapped: SearchStocksResult[] = allStocks.map(stockToSearchResult);

  if (user) {
    const { data: rolls } = await supabase
      .from("user_logged_rolls")
      .select("film_stock_slug")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (rolls && rolls.length > 0) {
      const seen = new Set<string>();
      const uniqueSlugs: string[] = [];
      for (const r of rolls) {
        if (!seen.has(r.film_stock_slug)) {
          seen.add(r.film_stock_slug);
          uniqueSlugs.push(r.film_stock_slug);
          if (uniqueSlugs.length >= 5) break;
        }
      }

      const bySlug = new Map(allMapped.map((s) => [s.slug, s]));
      const recentStocks: SearchStocksResult[] = [];
      for (const slug of uniqueSlugs) {
        const s = bySlug.get(slug);
        if (s) recentStocks.push(s);
      }
      if (recentStocks.length > 0) {
        return { label: "Recently logged", stocks: recentStocks, allStocks: allMapped };
      }
    }
  }

  const popularStocks = await getFilmStocks({ sort: "popular" });
  const topSlugs = popularStocks.slice(0, 20).map((s) => s.slug);
  const statsBySlug = topSlugs.length > 0 ? await getFilmStockStatsForSlugs(topSlugs) : {};

  const sorted = popularStocks
    .slice(0, 20)
    .sort((a, b) => {
      const ra = statsBySlug[a.slug]?.avgRating ?? 0;
      const rb = statsBySlug[b.slug]?.avgRating ?? 0;
      return rb - ra;
    })
    .slice(0, 5);

  return {
    label: "Trending film stocks",
    stocks: sorted.map(stockToSearchResult),
    allStocks: allMapped,
  };
}
