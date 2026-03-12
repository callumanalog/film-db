"use server";

import { createClient } from "@/lib/supabase/server";

export interface FilmReviewRow {
  id: string;
  user_id: string;
  film_stock_slug: string;
  rating: number | null;
  review_title: string | null;
  review_text: string | null;
  camera: string | null;
  created_at: string;
  display_name?: string | null;
}

/** All reviews for a film stock (for "Everyone" tab). Uses public read policy. */
export async function getReviewsForFilmStock(slug: string): Promise<FilmReviewRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, user_id, film_stock_slug, rating, review_title, review_text, camera, created_at")
    .eq("film_stock_slug", slug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getReviewsForFilmStock]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const nameByUserId = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameByUserId.set(p.id, p.display_name ?? null);
  }

  return (rows as { id: string; user_id: string; film_stock_slug: string; rating: number | null; review_title: string | null; review_text: string | null; camera: string | null; created_at: string }[]).map((r) => ({
    ...r,
    display_name: nameByUserId.get(r.user_id) ?? null,
  }));
}

/** Current user's reviews for a film stock (for "You" tab). */
export async function getMyReviewsForFilmStock(slug: string): Promise<FilmReviewRow[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, user_id, film_stock_slug, rating, review_title, review_text, camera, created_at")
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

  return (rows as { id: string; user_id: string; film_stock_slug: string; rating: number | null; review_title: string | null; review_text: string | null; camera: string | null; created_at: string }[]).map((r) => ({
    ...r,
    display_name: displayName,
  }));
}
