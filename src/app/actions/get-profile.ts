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
  /** User's reviews for profile "Your reviews" section */
  reviews: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  /** User's uploads for profile "Your uploads" section */
  uploads: { id: string; film_stock_slug: string; image_url: string | null; caption: string | null; created_at: string }[];
}

export async function getProfileFromSupabase(): Promise<ProfileFromDb | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[get-profile] auth error:", authError.message);
      return null;
    }
    if (!user) return null;

    const [profileRes, shotRes, favRes, shootlistRes, trackedRes, ratingsRes, reviewsRes, uploadsRes, reviewsListRes, uploadsListRes] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("user_shot").select("film_stock_slug").eq("user_id", user.id),
      supabase.from("user_favourites").select("film_stock_slug").eq("user_id", user.id),
      supabase.from("user_shootlist").select("film_stock_slug").eq("user_id", user.id),
      supabase.from("user_tracked").select("film_stock_slug, format, status, expiry_date, notes").eq("user_id", user.id),
      supabase.from("user_ratings").select("film_stock_slug, rating").eq("user_id", user.id),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("user_uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("reviews").select("id, film_stock_slug, review_title, created_at, rating").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_uploads").select("id, film_stock_slug, image_url, caption, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
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
      reviews: (reviewsListRes.data ?? []).map((r) => ({
        id: r.id,
        film_stock_slug: r.film_stock_slug,
        review_title: r.review_title,
        created_at: r.created_at,
        rating: r.rating != null ? Number(r.rating) : null,
      })),
      uploads: (uploadsListRes.data ?? []).map((u) => ({
        id: u.id,
        film_stock_slug: u.film_stock_slug,
        image_url: u.image_url,
        caption: u.caption,
        created_at: u.created_at,
      })),
    };
  } catch (err) {
    console.error("[get-profile] unexpected error:", err);
    return null;
  }
}
