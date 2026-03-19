"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleResult = { added: boolean; synced: boolean };
export type SetRatingResult = { synced: boolean };

export interface InCameraEntry {
  film_stock_slug: string;
  camera: string | null;
  format: string | null;
  created_at: string;
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("[user-actions] getCurrentUserId auth error:", error.message);
    return null;
  }
  if (!user) {
    console.warn("[user-actions] getCurrentUserId: no user (not logged in or session not in server action request)");
    return null;
  }
  return user.id;
}

/** Add or remove "shot it" for the current user. When logged in, persists to Supabase and revalidates the film page. */
export async function toggleShotInSupabase(slug: string): Promise<ToggleResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { added: false, synced: false };

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("user_shot")
    .select("id")
    .eq("user_id", userId)
    .eq("film_stock_slug", slug)
    .maybeSingle();

  if (fetchErr) {
    console.error("[user-actions] toggleShot fetch error:", fetchErr.message, { slug });
    return { added: false, synced: false };
  }

  if (existing) {
    const { error: deleteErr } = await supabase.from("user_shot").delete().eq("user_id", userId).eq("film_stock_slug", slug);
    if (deleteErr) {
      console.error("[user-actions] toggleShot delete error:", deleteErr.message, { slug });
      return { added: false, synced: false };
    }
    revalidatePath("/films/[slug]", "page");
    revalidatePath(`/films/${slug}`);
    return { added: false, synced: true };
  }
  const { error: insertErr } = await supabase.from("user_shot").insert({ user_id: userId, film_stock_slug: slug });
  if (insertErr) {
    console.error("[user-actions] toggleShot insert error:", insertErr.message, { slug });
    return { added: false, synced: false };
  }
  revalidatePath("/films/[slug]", "page");
  revalidatePath(`/films/${slug}`);
  return { added: true, synced: true };
}

/** Add or remove favourite for the current user. When logged in, persists to Supabase and revalidates the film page. */
export async function toggleFavouriteInSupabase(slug: string): Promise<ToggleResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { added: false, synced: false };

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("user_favourites")
    .select("id")
    .eq("user_id", userId)
    .eq("film_stock_slug", slug)
    .maybeSingle();

  if (fetchErr) {
    console.error("[user-actions] toggleFavourite fetch error:", fetchErr.message, { slug });
    return { added: false, synced: false };
  }

  if (existing) {
    const { error: deleteErr } = await supabase.from("user_favourites").delete().eq("user_id", userId).eq("film_stock_slug", slug);
    if (deleteErr) {
      console.error("[user-actions] toggleFavourite delete error:", deleteErr.message, { slug });
      return { added: false, synced: false };
    }
    revalidatePath("/films/[slug]", "page");
    revalidatePath(`/films/${slug}`);
    return { added: false, synced: true };
  }
  const { error: insertErr } = await supabase.from("user_favourites").insert({ user_id: userId, film_stock_slug: slug });
  if (insertErr) {
    console.error("[user-actions] toggleFavourite insert error:", insertErr.message, { slug });
    return { added: false, synced: false };
  }
  revalidatePath("/films/[slug]", "page");
  revalidatePath(`/films/${slug}`);
  return { added: true, synced: true };
}

/** Set star rating for the current user. When logged in, persists to Supabase and revalidates the film page. rating 0 = clear. */
export async function setRatingInSupabase(slug: string, rating: number): Promise<SetRatingResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { synced: false };

  const supabase = await createClient();
  const value = Math.max(0, Math.min(5, Math.round(rating * 2) / 2)); // clamp 0–5, half steps

  if (value <= 0) {
    const { error: deleteErr } = await supabase.from("user_ratings").delete().eq("user_id", userId).eq("film_stock_slug", slug);
    if (deleteErr) {
      console.error("[user-actions] setRating delete error:", deleteErr.message, { slug });
      return { synced: false };
    }
  } else {
    const { error: upsertErr } = await supabase.from("user_ratings").upsert(
      { user_id: userId, film_stock_slug: slug, rating: value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,film_stock_slug" }
    );
    if (upsertErr) {
      console.error("[user-actions] setRating upsert error:", upsertErr.message, { slug });
      return { synced: false };
    }
  }
  revalidatePath("/films/[slug]", "page");
  revalidatePath(`/films/${slug}`);
  return { synced: true };
}

/** Toggle "in camera" status for the current user. Insert with optional metadata or delete if already set. */
export async function toggleInCameraInSupabase(
  slug: string,
  metadata?: { camera?: string; format?: string }
): Promise<ToggleResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { added: false, synced: false };

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("user_in_camera")
    .select("id")
    .eq("user_id", userId)
    .eq("film_stock_slug", slug)
    .maybeSingle();

  if (fetchErr) {
    console.error("[user-actions] toggleInCamera fetch error:", fetchErr.message, { slug });
    return { added: false, synced: false };
  }

  if (existing) {
    const { error: deleteErr } = await supabase.from("user_in_camera").delete().eq("user_id", userId).eq("film_stock_slug", slug);
    if (deleteErr) {
      console.error("[user-actions] toggleInCamera delete error:", deleteErr.message, { slug });
      return { added: false, synced: false };
    }
    revalidatePath("/films/[slug]", "page");
    revalidatePath(`/films/${slug}`);
    revalidatePath("/profile");
    return { added: false, synced: true };
  }

  const { error: insertErr } = await supabase.from("user_in_camera").insert({
    user_id: userId,
    film_stock_slug: slug,
    camera: metadata?.camera || null,
    format: metadata?.format || null,
  });
  if (insertErr) {
    console.error("[user-actions] toggleInCamera insert error:", insertErr.message, { slug });
    return { added: false, synced: false };
  }
  revalidatePath("/films/[slug]", "page");
  revalidatePath(`/films/${slug}`);
  revalidatePath("/profile");
  return { added: true, synced: true };
}

/** Fetch all "in camera" stocks for the current user. */
export async function getInCameraStocks(): Promise<InCameraEntry[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_in_camera")
    .select("film_stock_slug, camera, format, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[user-actions] getInCameraStocks error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    film_stock_slug: r.film_stock_slug,
    camera: r.camera ?? null,
    format: r.format ?? null,
    created_at: r.created_at,
  }));
}
