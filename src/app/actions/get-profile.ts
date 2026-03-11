"use server";

import { createClient } from "@/lib/supabase/server";
import type { TrackedEntry } from "@/lib/user-store";

export interface ProfileFromDb {
  displayName: string;
  shotSlugs: string[];
  favouriteSlugs: string[];
  tracked: TrackedEntry[];
  ratings: Record<string, number>;
  reviewCount: number;
  uploadCount: number;
}

export async function getProfileFromSupabase(): Promise<ProfileFromDb | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const [profileRes, shotRes, favRes, shootlistRes, trackedRes, ratingsRes, reviewsRes, uploadsRes] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("user_shot").select("film_stock_slug").eq("user_id", user.id),
    supabase.from("user_favourites").select("film_stock_slug").eq("user_id", user.id),
    supabase.from("user_shootlist").select("film_stock_slug").eq("user_id", user.id),
    supabase.from("user_tracked").select("film_stock_slug, format, status, expiry_date, notes").eq("user_id", user.id),
    supabase.from("user_ratings").select("film_stock_slug, rating").eq("user_id", user.id),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const displayName =
    (profileRes.data?.display_name as string) ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Member";

  const shotSlugs = (shotRes.data ?? []).map((r) => r.film_stock_slug);
  const favouriteSlugs = (favRes.data ?? []).map((r) => r.film_stock_slug);
  const shootlistSlugs = (shootlistRes.data ?? []).map((r) => r.film_stock_slug);
  const tracked: TrackedEntry[] = (trackedRes.data ?? []).map((r) => ({
    slug: r.film_stock_slug,
    format: r.format ?? "",
    status: r.status ?? "",
    expiryDate: r.expiry_date ?? "",
    notes: r.notes ?? "",
  }));
  const ratings: Record<string, number> = {};
  for (const r of ratingsRes.data ?? []) {
    ratings[r.film_stock_slug] = Number(r.rating);
  }

  return {
    displayName,
    shotSlugs,
    favouriteSlugs: favouriteSlugs.length ? favouriteSlugs : shootlistSlugs,
    tracked,
    ratings,
    reviewCount: reviewsRes.count ?? 0,
    uploadCount: uploadsRes.count ?? 0,
  };
}
