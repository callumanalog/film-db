"use server";

import { getFilmStocks, getBrands } from "@/lib/supabase/queries";
import { getAllCommunityUploadsForGallery } from "@/app/actions/uploads";
import { createClient } from "@/lib/supabase/server";

export type SearchTab = "stocks" | "shots" | "notes" | "brands" | "users";

export interface SearchStocksResult {
  slug: string;
  name: string;
  iso?: number | null;
  type?: string;
  brandName: string;
  imageUrl?: string | null;
}

export interface SearchBrandsResult {
  slug: string;
  name: string;
  country?: string | null;
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
      return {
        stocks: stocks.map((s) => ({
          slug: s.slug,
          name: s.name,
          iso: s.iso ?? null,
          type: s.type ?? undefined,
          brandName: s.brand?.name ?? "",
          imageUrl: s.image_url ?? null,
        })),
      };
    }
    case "brands": {
      const brands = await getBrands();
      const lower = q.toLowerCase();
      const filtered = brands.filter(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          (b.slug && b.slug.toLowerCase().includes(lower))
      );
      return {
        brands: filtered.map((b) => ({
          slug: b.slug,
          name: b.name,
          country: b.country ?? null,
        })),
      };
    }
    case "shots": {
      const stocks = await getFilmStocks({ sort: "alphabetical" });
      const uploads = await getAllCommunityUploadsForGallery(stocks, q);
      return {
        shots: uploads.map((u) => ({
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
