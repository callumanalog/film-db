"use server";

import { createClient } from "@/lib/supabase/server";

export interface FilmUploadRow {
  id: string;
  user_id: string;
  film_stock_slug: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  display_name?: string | null;
}

/** Shape for Community page gallery: one row per upload with stock/brand labels. */
export interface CommunityGalleryUpload {
  id: string;
  galleryId: string;
  stockSlug: string;
  stockName: string;
  brandName: string;
  username: string;
  camera: string;
  settings: string;
  likes: number;
  source: "community";
  imageUrl: string | null;
}

/** All community uploads for the global Community page gallery. */
export async function getAllCommunityUploadsForGallery(stocks: { slug: string; name: string; brand: { name: string } }[]): Promise<CommunityGalleryUpload[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("user_uploads")
    .select("id, user_id, film_stock_slug, image_url, caption, created_at")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllCommunityUploadsForGallery]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const slugs = [...new Set((rows as { film_stock_slug: string }[]).map((r) => r.film_stock_slug))];
  const stockBySlug = new Map(slugs.map((slug) => [slug, stocks.find((s) => s.slug === slug)]));

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);
  const nameByUserId = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameByUserId.set(p.id, p.display_name ?? "Member");
  }

  const out: CommunityGalleryUpload[] = [];
  for (const r of rows as { id: string; user_id: string; film_stock_slug: string; image_url: string | null; caption: string | null; created_at: string }[]) {
    const stock = stockBySlug.get(r.film_stock_slug);
    if (!stock) continue;
    out.push({
      id: r.id,
      galleryId: `upload-${r.id}`,
      stockSlug: r.film_stock_slug,
      stockName: stock.name,
      brandName: stock.brand.name,
      username: nameByUserId.get(r.user_id) ?? "Member",
      camera: r.caption ?? "",
      settings: "",
      likes: 0,
      source: "community",
      imageUrl: r.image_url,
    });
  }
  return out;
}
export async function getUploadsForFilmStock(slug: string): Promise<FilmUploadRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("user_uploads")
    .select("id, user_id, film_stock_slug, image_url, caption, created_at")
    .eq("film_stock_slug", slug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUploadsForFilmStock]", error.message);
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

  return (rows as { id: string; user_id: string; film_stock_slug: string; image_url: string | null; caption: string | null; created_at: string }[]).map((r) => ({
    ...r,
    display_name: nameByUserId.get(r.user_id) ?? null,
  }));
}

/** Current user's uploads for a film stock (for "You" tab). */
export async function getMyUploadsForFilmStock(slug: string): Promise<FilmUploadRow[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data: rows, error } = await supabase
    .from("user_uploads")
    .select("id, user_id, film_stock_slug, image_url, caption, created_at")
    .eq("film_stock_slug", slug)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyUploadsForFilmStock]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const displayName =
    (await supabase.from("profiles").select("display_name").eq("id", user.id).single()).data?.display_name ?? null;

  return (rows as { id: string; user_id: string; film_stock_slug: string; image_url: string | null; caption: string | null; created_at: string }[]).map((r) => ({
    ...r,
    display_name: displayName,
  }));
}
