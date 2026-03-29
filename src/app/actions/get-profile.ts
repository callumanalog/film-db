"use server";

import { createClient } from "@/lib/supabase/server";
import type { InCameraEntry } from "@/app/actions/user-actions";

export interface ProfileFromDb {
  displayName: string;
  shotSlugs: string[];
  favouriteSlugs: string[];
  inCameraEntries: InCameraEntry[];
  ratings: Record<string, number>;
  reviewCount: number;
  uploadCount: number;
  reviews: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  uploads: { id: string; film_stock_slug: string; image_url: string | null; caption: string | null; created_at: string }[];
  likedReviews: {
    review_id: string;
    film_stock_slug: string;
    review_title: string | null;
    rating: number | null;
    review_created_at: string;
    liked_at: string;
  }[];
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

    const [
      profileRes,
      shotRes,
      favRes,
      inCameraRes,
      ratingsRes,
      reviewsRes,
      uploadsRes,
      reviewsListRes,
      uploadsListRes,
      likedReviewsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("user_shot").select("film_stock_slug").eq("user_id", user.id),
      supabase.from("user_favourites").select("film_stock_slug").eq("user_id", user.id),
      supabase.from("user_in_camera").select("film_stock_slug, camera, format, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_ratings").select("film_stock_slug, rating").eq("user_id", user.id),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("user_uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("reviews").select("id, film_stock_slug, review_title, created_at, rating").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("user_uploads")
        .select(
          "id, film_stock_slug, image_url, caption, created_at, camera, shot_iso, lens, lab, filter, scanner, push_pull, format, location, upload_batch_id"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("review_likes")
        .select("created_at, reviews ( id, film_stock_slug, review_title, rating, created_at )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const displayName =
      (profileRes.data?.display_name as string) ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Member";

    const shotSlugs = (shotRes.data ?? []).map((r) => r.film_stock_slug);
    const favouriteSlugs = (favRes.data ?? []).map((r) => r.film_stock_slug);
    const inCameraEntries: InCameraEntry[] = (inCameraRes.data ?? []).map((r) => ({
      film_stock_slug: r.film_stock_slug,
      camera: r.camera ?? null,
      format: r.format ?? null,
      created_at: r.created_at,
    }));
    const ratings: Record<string, number> = {};
    for (const r of ratingsRes.data ?? []) {
      ratings[r.film_stock_slug] = Number(r.rating);
    }

    if (likedReviewsRes.error) {
      console.error("[get-profile] review_likes:", likedReviewsRes.error.message);
    }
    const likedReviewsRaw = likedReviewsRes.error ? [] : (likedReviewsRes.data ?? []);
    const likedReviews: ProfileFromDb["likedReviews"] = [];
    for (const row of likedReviewsRaw as {
      created_at: string;
      reviews:
        | {
            id: string;
            film_stock_slug: string;
            review_title: string | null;
            rating: number | string | null;
            created_at: string;
          }
        | {
            id: string;
            film_stock_slug: string;
            review_title: string | null;
            rating: number | string | null;
            created_at: string;
          }[]
        | null;
    }[]) {
      const raw = row.reviews;
      const rev = Array.isArray(raw) ? raw[0] : raw;
      if (!rev) continue;
      likedReviews.push({
        review_id: rev.id,
        film_stock_slug: rev.film_stock_slug,
        review_title: rev.review_title,
        rating: rev.rating != null ? Number(rev.rating) : null,
        review_created_at: rev.created_at,
        liked_at: row.created_at,
      });
    }

    return {
      displayName,
      shotSlugs,
      favouriteSlugs,
      inCameraEntries,
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
      likedReviews,
    };
  } catch (err) {
    console.error("[get-profile] unexpected error:", err);
    return null;
  }
}
