"use server";

import { createClient } from "@/lib/supabase/server";
import type { InCameraEntry } from "@/app/actions/user-actions";

export interface ProfileFromDb {
  /** Unique handle (`profiles.display_name`). */
  displayName: string;
  /** Optional friendly name (`profiles.full_name`); UI falls back to displayName when null. */
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  followersCount: number;
  followingCount: number;
  shotSlugs: string[];
  favouriteSlugs: string[];
  inCameraEntries: InCameraEntry[];
  ratings: Record<string, number>;
  reviewCount: number;
  uploadCount: number;
  reviews: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  uploads: {
    id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    created_at: string;
    upload_batch_id?: string | null;
  }[];
  likedReviews: {
    review_id: string;
    film_stock_slug: string;
    review_title: string | null;
    rating: number | null;
    review_created_at: string;
    liked_at: string;
  }[];
  /** Community scans the user saved (saved_uploads). */
  savedUploads: {
    savedUploadId: string;
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    saved_at: string;
  }[];
  boards: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
    itemCount: number;
    coverUrl: string | null;
    coverUrl2: string | null;
    coverUrl3: string | null;
  }[];
  /** Community scans the user liked (upload_likes). */
  likedUploads: {
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
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
      savedUploadsRes,
      boardSummariesRes,
      likedUploadsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, full_name, bio, avatar_url, instagram_url, website_url, followers_count, following_count"
        )
        .eq("id", user.id)
        .single(),
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
      supabase
        .from("saved_uploads")
        .select(
          "id, created_at, user_uploads ( id, film_stock_slug, image_url, caption )"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("board_summaries_for_user"),
      supabase
        .from("upload_likes")
        .select(
          "created_at, user_uploads ( id, film_stock_slug, image_url, caption )"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.error) {
      console.error("[get-profile] profiles:", profileRes.error.message);
    }

    const profileRow = profileRes.error
      ? null
      : (profileRes.data as {
          display_name?: string | null;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          instagram_url?: string | null;
          website_url?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
        } | null);

    const displayName =
      profileRow?.display_name?.trim() ||
      (user.user_metadata?.display_name as string)?.trim() ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Member";

    const fullName = profileRow?.full_name?.trim() ? profileRow.full_name.trim() : null;
    const bio = profileRow?.bio?.trim() ? profileRow.bio.trim() : null;
    const avatarUrl = profileRow?.avatar_url?.trim() ? profileRow.avatar_url.trim() : null;
    const instagramUrl = profileRow?.instagram_url?.trim() ? profileRow.instagram_url.trim() : null;
    const websiteUrl = profileRow?.website_url?.trim() ? profileRow.website_url.trim() : null;
    const followersCount = Math.max(0, Number(profileRow?.followers_count ?? 0));
    const followingCount = Math.max(0, Number(profileRow?.following_count ?? 0));

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

    if (savedUploadsRes.error) {
      console.error("[get-profile] saved_uploads:", savedUploadsRes.error.message);
    }
    const savedUploadsRaw = savedUploadsRes.error ? [] : (savedUploadsRes.data ?? []);
    const savedUploads: ProfileFromDb["savedUploads"] = [];
    for (const row of savedUploadsRaw as {
      id: string;
      created_at: string;
      user_uploads:
        | {
            id: string;
            film_stock_slug: string;
            image_url: string | null;
            caption: string | null;
          }
        | {
            id: string;
            film_stock_slug: string;
            image_url: string | null;
            caption: string | null;
          }[]
        | null;
    }[]) {
      const raw = row.user_uploads;
      const up = Array.isArray(raw) ? raw[0] : raw;
      if (!up) continue;
      savedUploads.push({
        savedUploadId: row.id as string,
        upload_id: up.id,
        film_stock_slug: up.film_stock_slug,
        image_url: up.image_url,
        caption: up.caption,
        saved_at: row.created_at,
      });
    }

    let boards: ProfileFromDb["boards"] = [];
    if (boardSummariesRes.error) {
      console.error("[get-profile] board_summaries_for_user:", boardSummariesRes.error.message);
    } else {
      const rawBoards = (boardSummariesRes.data ?? []) as {
        board_id: string;
        board_name: string;
        board_description: string | null;
        updated_at: string;
        item_count: number | string;
        cover_url: string | null;
        cover_url_2: string | null;
        cover_url_3: string | null;
      }[];
      boards = rawBoards.map((r) => ({
        id: r.board_id,
        name: r.board_name,
        description: r.board_description,
        updatedAt: r.updated_at,
        itemCount: Number(r.item_count),
        coverUrl: r.cover_url,
        coverUrl2: r.cover_url_2,
        coverUrl3: r.cover_url_3,
      }));
    }

    if (likedUploadsRes.error) {
      console.error("[get-profile] upload_likes:", likedUploadsRes.error.message);
    }
    const likedUploadsRaw = likedUploadsRes.error ? [] : (likedUploadsRes.data ?? []);
    const likedUploads: ProfileFromDb["likedUploads"] = [];
    for (const row of likedUploadsRaw as {
      created_at: string;
      user_uploads:
        | {
            id: string;
            film_stock_slug: string;
            image_url: string | null;
            caption: string | null;
          }
        | {
            id: string;
            film_stock_slug: string;
            image_url: string | null;
            caption: string | null;
          }[]
        | null;
    }[]) {
      const raw = row.user_uploads;
      const up = Array.isArray(raw) ? raw[0] : raw;
      if (!up) continue;
      likedUploads.push({
        upload_id: up.id,
        film_stock_slug: up.film_stock_slug,
        image_url: up.image_url,
        caption: up.caption,
        liked_at: row.created_at,
      });
    }

    return {
      displayName,
      fullName,
      bio,
      avatarUrl,
      instagramUrl,
      websiteUrl,
      followersCount,
      followingCount,
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
        upload_batch_id: u.upload_batch_id ?? null,
      })),
      likedReviews,
      savedUploads,
      likedUploads,
      boards,
    };
  } catch (err) {
    console.error("[get-profile] unexpected error:", err);
    return null;
  }
}
