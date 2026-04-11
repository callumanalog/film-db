"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchMemberPublicFieldsByUserIds,
  type MemberPublicFields,
} from "@/lib/supabase/fetch-display-names-batch";

export interface FilmReviewRow {
  id: string;
  user_id: string;
  film_stock_slug: string;
  rating: number | null;
  review_title: string | null;
  review_text: string | null;
  shooting_tip: string | null;
  camera: string | null;
  best_for: string[];
  created_at: string;
  display_name?: string | null;
  /** Public profile image from `profiles.avatar_url` (service-role read where configured). */
  avatar_url?: string | null;
  like_count: number;
  liked_by_me: boolean;
  /** Image URLs from user_uploads linked via review_id (same submission as the review). */
  scan_urls: string[];
}

type ReviewRowDb = {
  id: string;
  user_id: string;
  film_stock_slug: string;
  rating: number | null;
  review_title: string | null;
  review_text: string | null;
  shooting_tip: string | null;
  camera: string | null;
  best_for: string[] | null;
  created_at: string;
};

function profileFieldsForUser(
  memberByUserId: Map<string, MemberPublicFields>,
  userId: string
): { display_name: string | null; avatar_url: string | null } {
  const m = memberByUserId.get(userId);
  return {
    display_name: m?.displayName ?? null,
    avatar_url: m?.avatarUrl ?? null,
  };
}

async function attachReviewLikeData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ReviewRowDb[],
  memberByUserId: Map<string, MemberPublicFields>,
  currentUserId: string | null
): Promise<FilmReviewRow[]> {
  if (rows.length === 0) return [];

  const reviewIds = rows.map((r) => r.id);

  const { data: likeRows, error: likesError } = await supabase
    .from("review_likes")
    .select("review_id, user_id")
    .in("review_id", reviewIds);

  if (likesError) {
    console.error("[reviews] review_likes read:", likesError.message);
    const base = rows.map((r) => {
      const { display_name, avatar_url } = profileFieldsForUser(memberByUserId, r.user_id);
      return {
        ...r,
        best_for: r.best_for ?? [],
        display_name,
        avatar_url,
        like_count: 0,
        liked_by_me: false,
      };
    });
    return attachScanUrls(supabase, base);
  }

  const countByReview = new Map<string, number>();
  const myLiked = new Set<string>();
  for (const row of likeRows ?? []) {
    const rid = row.review_id as string;
    countByReview.set(rid, (countByReview.get(rid) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      myLiked.add(rid);
    }
  }

  const withLikes = rows.map((r) => {
    const { display_name, avatar_url } = profileFieldsForUser(memberByUserId, r.user_id);
    return {
      ...r,
      best_for: r.best_for ?? [],
      display_name,
      avatar_url,
      like_count: countByReview.get(r.id) ?? 0,
      liked_by_me: myLiked.has(r.id),
    };
  });
  return attachScanUrls(supabase, withLikes);
}

/** Load user_uploads rows tied to these reviews (ordered oldest-first per review). */
async function attachScanUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Omit<FilmReviewRow, "scan_urls">[]
): Promise<FilmReviewRow[]> {
  if (rows.length === 0) return [];
  const reviewIds = rows.map((r) => r.id);
  const { data: uploads, error } = await supabase
    .from("user_uploads")
    .select("review_id, image_url, created_at")
    .in("review_id", reviewIds)
    .not("image_url", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[reviews] user_uploads by review_id:", error.message);
    return rows.map((r) => ({ ...r, scan_urls: [] }));
  }

  const byReview = new Map<string, string[]>();
  for (const u of uploads ?? []) {
    const rid = u.review_id as string | null;
    const url = typeof u.image_url === "string" ? u.image_url.trim() : "";
    if (!rid || !url) continue;
    const list = byReview.get(rid) ?? [];
    list.push(url);
    byReview.set(rid, list);
  }

  return rows.map((r) => ({ ...r, scan_urls: byReview.get(r.id) ?? [] }));
}

/** All reviews for a film stock (for "Everyone" tab). Uses public read policy. */
export async function getReviewsForFilmStock(slug: string): Promise<FilmReviewRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, user_id, film_stock_slug, rating, review_title, review_text, shooting_tip, camera, best_for, created_at")
    .eq("film_stock_slug", slug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getReviewsForFilmStock]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const memberByUserId = await fetchMemberPublicFieldsByUserIds(userIds);

  return attachReviewLikeData(supabase, rows as ReviewRowDb[], memberByUserId, user?.id ?? null);
}

/** Current user's reviews for a film stock (for "You" tab). */
export async function getMyReviewsForFilmStock(slug: string): Promise<FilmReviewRow[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, user_id, film_stock_slug, rating, review_title, review_text, shooting_tip, camera, best_for, created_at")
    .eq("film_stock_slug", slug)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyReviewsForFilmStock]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const { data: prof } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const av =
    typeof prof?.avatar_url === "string" && prof.avatar_url.trim() ? prof.avatar_url.trim() : null;
  const memberByUserId = new Map<string, MemberPublicFields>([
    [user.id, { displayName: prof?.display_name ?? null, avatarUrl: av }],
  ]);

  return attachReviewLikeData(supabase, rows as ReviewRowDb[], memberByUserId, user.id);
}

/** Reviews for this stock authored only by users the current user follows. */
export async function getFollowingReviewsForFilmStock(slug: string): Promise<FilmReviewRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: followRows, error: followError } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (followError) {
    console.error("[getFollowingReviewsForFilmStock] follows:", followError.message);
    return [];
  }

  const followingIds = (followRows ?? []).map((r) => r.following_id as string).filter(Boolean);
  if (followingIds.length === 0) return [];

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, user_id, film_stock_slug, rating, review_title, review_text, shooting_tip, camera, best_for, created_at")
    .eq("film_stock_slug", slug)
    .in("user_id", followingIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getFollowingReviewsForFilmStock]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const memberByUserId = await fetchMemberPublicFieldsByUserIds(userIds);

  return attachReviewLikeData(supabase, rows as ReviewRowDb[], memberByUserId, user.id);
}
