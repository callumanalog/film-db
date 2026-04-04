"use server";

import { createClient } from "@/lib/supabase/server";

export type ToggleFollowFilmStockResult =
  | { ok: true; following: boolean }
  | { ok: false; error: "sign_in_required" | "invalid_slug" | string };

export async function toggleFollowFilmStock(slug: string): Promise<ToggleFollowFilmStockResult> {
  const film_stock_slug = slug?.trim();
  if (!film_stock_slug) return { ok: false, error: "invalid_slug" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: existing, error: selErr } = await supabase
    .from("user_followed_film_stocks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("film_stock_slug", film_stock_slug)
    .maybeSingle();

  if (selErr) {
    console.error("[toggleFollowFilmStock] select", selErr.message);
    return { ok: false, error: selErr.message };
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("user_followed_film_stocks")
      .delete()
      .eq("user_id", user.id)
      .eq("film_stock_slug", film_stock_slug);
    if (delErr) {
      console.error("[toggleFollowFilmStock] delete", delErr.message);
      return { ok: false, error: delErr.message };
    }
    return { ok: true, following: false };
  }

  const { error: insErr } = await supabase.from("user_followed_film_stocks").insert({
    user_id: user.id,
    film_stock_slug,
  });
  if (insErr) {
    console.error("[toggleFollowFilmStock] insert", insErr.message);
    return { ok: false, error: insErr.message };
  }
  return { ok: true, following: true };
}

/** Whether the current user follows this stock (false if signed out). */
export async function isFollowingFilmStock(slug: string): Promise<boolean> {
  const film_stock_slug = slug?.trim();
  if (!film_stock_slug) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("user_followed_film_stocks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("film_stock_slug", film_stock_slug)
    .maybeSingle();

  if (error) {
    console.error("[isFollowingFilmStock]", error.message);
    return false;
  }
  return data != null;
}

export async function getFollowedFilmStockSlugsForUser(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_followed_film_stocks")
    .select("film_stock_slug")
    .eq("user_id", user.id);

  if (error) {
    console.error("[getFollowedFilmStockSlugsForUser]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.film_stock_slug as string).filter(Boolean);
}
