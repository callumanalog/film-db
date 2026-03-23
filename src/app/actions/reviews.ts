"use server";

import { createClient } from "@/lib/supabase/server";

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
  like_count: number;
  liked_by_me: boolean;
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

async function attachReviewLikeData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ReviewRowDb[],
  displayNameByUserId: Map<string, string | null>,
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
    return rows.map((r) => ({
      ...r,
      best_for: r.best_for ?? [],
      display_name: displayNameByUserId.get(r.user_id) ?? null,
      like_count: 0,
      liked_by_me: false,
    }));
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

  return rows.map((r) => ({
    ...r,
    best_for: r.best_for ?? [],
    display_name: displayNameByUserId.get(r.user_id) ?? null,
    like_count: countByReview.get(r.id) ?? 0,
    liked_by_me: myLiked.has(r.id),
  }));
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
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);

  const nameByUserId = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameByUserId.set(p.id, p.display_name ?? null);
  }

  return attachReviewLikeData(supabase, rows as ReviewRowDb[], nameByUserId, user?.id ?? null);
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

  const displayName =
    (await supabase.from("profiles").select("display_name").eq("id", user.id).single()).data?.display_name ?? null;

  const nameByUserId = new Map<string, string | null>([[user.id, displayName]]);

  return attachReviewLikeData(supabase, rows as ReviewRowDb[], nameByUserId, user.id);
}
