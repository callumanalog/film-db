"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const USER_UPLOAD_ROW_SELECT =
  "id, user_id, film_stock_slug, image_url, caption, created_at, camera, shot_iso, lens, lab, filter, scanner, push_pull, format, location, upload_batch_id, image_width, image_height";

export interface FilmUploadRow {
  id: string;
  user_id: string;
  film_stock_slug: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  display_name?: string | null;
  camera?: string | null;
  shot_iso?: string | null;
  lens?: string | null;
  lab?: string | null;
  filter?: string | null;
  scanner?: string | null;
  push_pull?: string | null;
  format?: string | null;
  location?: string | null;
  /** Shared id for all images from the same submit (batch of 1–10). */
  upload_batch_id?: string | null;
  /** Set on upload when available; used for film hero landscape carousel. */
  image_width?: number | null;
  image_height?: number | null;
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

/** All community uploads for the global Community page gallery. Optional search by caption/metadata and/or by film stock slugs (e.g. match by stock name). */
export async function getAllCommunityUploadsForGallery(
  stocks: { slug: string; name: string; brand: { name: string } }[],
  search?: string,
  matchingStockSlugs?: string[]
): Promise<CommunityGalleryUpload[]> {
  const supabase = await createClient();
  let query = supabase
    .from("user_uploads")
    .select(USER_UPLOAD_ROW_SELECT)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false });
  const term = search?.trim();
  const slugFilter = matchingStockSlugs?.length ? matchingStockSlugs : [];
  if (term && slugFilter.length > 0) {
    const pattern = `%${term}%`;
    const textOr = `caption.ilike.${pattern},camera.ilike.${pattern},shot_iso.ilike.${pattern},lens.ilike.${pattern},lab.ilike.${pattern},filter.ilike.${pattern},scanner.ilike.${pattern},push_pull.ilike.${pattern},format.ilike.${pattern},location.ilike.${pattern}`;
    const slugIn = `film_stock_slug.in.(${slugFilter.map((s) => `"${s.replace(/"/g, '\\"')}"`).join(",")})`;
    query = query.or(`${textOr},${slugIn}`);
  } else if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      `caption.ilike.${pattern},camera.ilike.${pattern},shot_iso.ilike.${pattern},lens.ilike.${pattern},lab.ilike.${pattern},filter.ilike.${pattern},scanner.ilike.${pattern},push_pull.ilike.${pattern},format.ilike.${pattern},location.ilike.${pattern}`
    );
  } else if (slugFilter.length > 0) {
    query = query.in("film_stock_slug", slugFilter);
  }
  const { data: rows, error } = await query;

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
  for (const r of rows as FilmUploadRow[]) {
    const stock = stockBySlug.get(r.film_stock_slug);
    if (!stock) continue;
    const settingsParts = [
      r.format,
      r.location,
      r.shot_iso,
      r.lens,
      r.lab,
      r.push_pull,
      r.filter,
      r.scanner,
    ].filter(Boolean);
    out.push({
      id: r.id,
      galleryId: `upload-${r.id}`,
      stockSlug: r.film_stock_slug,
      stockName: stock.name,
      brandName: stock.brand.name,
      username: nameByUserId.get(r.user_id) ?? "Member",
      camera: r.camera ?? "",
      settings: settingsParts.join(" · "),
      likes: 0,
      source: "community",
      imageUrl: r.image_url,
    });
  }
  return out;
}
export async function getUploadsForFilmStock(slug: string): Promise<FilmUploadRow[]> {
  const supabase = (await createServiceRoleClient()) ?? (await createClient());
  const { data: rows, error } = await supabase
    .from("user_uploads")
    .select(USER_UPLOAD_ROW_SELECT)
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

  return (rows as (FilmUploadRow & { created_at: string })[]).map((r) => ({
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
    .select(USER_UPLOAD_ROW_SELECT)
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

  return (rows as (FilmUploadRow & { created_at: string })[]).map((r) => ({
    ...r,
    display_name: displayName,
  }));
}

/** Uploads for this stock from users the current user follows. */
export async function getFollowingUploadsForFilmStock(slug: string): Promise<FilmUploadRow[]> {
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
    console.error("[getFollowingUploadsForFilmStock] follows:", followError.message);
    return [];
  }

  const followingIds = (followRows ?? []).map((r) => r.following_id as string).filter(Boolean);
  if (followingIds.length === 0) return [];

  const { data: rows, error } = await supabase
    .from("user_uploads")
    .select(USER_UPLOAD_ROW_SELECT)
    .eq("film_stock_slug", slug)
    .in("user_id", followingIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getFollowingUploadsForFilmStock]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);

  const nameByUserId = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameByUserId.set(p.id, p.display_name ?? null);
  }

  return (rows as (FilmUploadRow & { created_at: string })[]).map((r) => ({
    ...r,
    display_name: nameByUserId.get(r.user_id) ?? null,
  }));
}


/** All uploads from the same submission (1–10 images). Public read via RLS. */
export async function getUploadsByUploadBatchId(uploadBatchId: string): Promise<FilmUploadRow[]> {
  const id = uploadBatchId?.trim();
  if (!id) return [];

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("user_uploads")
    .select(USER_UPLOAD_ROW_SELECT)
    .eq("upload_batch_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getUploadsByUploadBatchId]", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);

  const nameByUserId = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameByUserId.set(p.id, p.display_name ?? null);
  }

  return (rows as (FilmUploadRow & { created_at: string })[]).map((r) => ({
    ...r,
    display_name: nameByUserId.get(r.user_id) ?? null,
  }));
}

