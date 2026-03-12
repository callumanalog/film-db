"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TrackedEntry } from "@/lib/user-store";

export type ToggleResult = { added: boolean; synced: boolean };
export type SetRatingResult = { synced: boolean };

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

/** Upsert tracked (roll) entry for the current user. Persists to Supabase so it appears on their profile. */
export async function upsertTrackedInSupabase(entry: TrackedEntry): Promise<{ synced: boolean }> {
  const userId = await getCurrentUserId();
  if (!userId) return { synced: false };

  const supabase = await createClient();
  const { error } = await supabase.from("user_tracked").upsert(
    {
      user_id: userId,
      film_stock_slug: entry.slug,
      format: entry.format ?? "",
      status: entry.status ?? "",
      expiry_date: entry.expiryDate ?? null,
      notes: entry.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,film_stock_slug" }
  );
  if (error) {
    console.error("[user-actions] upsertTracked error:", error.message, { slug: entry.slug });
    return { synced: false };
  }
  revalidatePath("/films/[slug]", "page");
  revalidatePath(`/films/${entry.slug}`);
  revalidatePath("/profile");
  return { synced: true };
}

/** Remove a tracked entry for the current user. */
export async function removeTrackedInSupabase(slug: string): Promise<{ synced: boolean }> {
  const userId = await getCurrentUserId();
  if (!userId) return { synced: false };

  const supabase = await createClient();
  const { error } = await supabase.from("user_tracked").delete().eq("user_id", userId).eq("film_stock_slug", slug);
  if (error) {
    console.error("[user-actions] removeTracked error:", error.message, { slug });
    return { synced: false };
  }
  revalidatePath("/films/[slug]", "page");
  revalidatePath(`/films/${slug}`);
  revalidatePath("/profile");
  return { synced: true };
}
