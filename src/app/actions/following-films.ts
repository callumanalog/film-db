"use server";

import { createClient } from "@/lib/supabase/server";

/** Distinct film slugs with recent uploads or reviews by users the current user follows (newest activity first). */
export async function getFollowingActivityFilmSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: followRows, error: followError } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (followError || !followRows?.length) return [];

  const followingIds = followRows.map((r) => r.following_id as string).filter(Boolean);
  if (followingIds.length === 0) return [];

  const [uploadsRes, reviewsRes] = await Promise.all([
    supabase
      .from("user_uploads")
      .select("film_stock_slug, created_at")
      .in("user_id", followingIds)
      .not("film_stock_slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("reviews")
      .select("film_stock_slug, created_at")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(400),
  ]);

  type Row = { film_stock_slug: string | null; created_at: string };
  const scored: { slug: string; t: number }[] = [];
  for (const r of (uploadsRes.data ?? []) as Row[]) {
    if (r.film_stock_slug) {
      scored.push({ slug: r.film_stock_slug, t: new Date(r.created_at).getTime() });
    }
  }
  for (const r of (reviewsRes.data ?? []) as Row[]) {
    if (r.film_stock_slug) {
      scored.push({ slug: r.film_stock_slug, t: new Date(r.created_at).getTime() });
    }
  }
  scored.sort((a, b) => b.t - a.t);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const { slug } of scored) {
    if (!seen.has(slug)) {
      seen.add(slug);
      ordered.push(slug);
    }
  }
  return ordered;
}
