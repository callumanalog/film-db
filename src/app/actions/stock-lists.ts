"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TITLE_MAX = 200;
const DESC_MAX = 2000;
const TAG_MAX_LEN = 40;

export type StockListSummaryRow = {
  id: string;
  title: string;
  updatedAt: string;
  itemCount: number;
  /** Up to 5 preview image URLs in list order (from `stock_list_summaries_for_user`). */
  previewUrls: (string | null)[];
};

export type StockListPickerRow = {
  id: string;
  title: string;
  itemCount: number;
};

export type StockListFilmRow = {
  listId: string;
  title: string;
  updatedAt: string;
  ownerUserId: string;
  ownerDisplayName: string;
};

function revalidateListPaths(listId: string, filmSlugs?: string[]) {
  revalidatePath("/profile");
  revalidatePath(`/lists/${listId}`);
  revalidatePath(`/lists/${listId}/edit`);
  for (const s of filmSlugs ?? []) {
    revalidatePath(`/films/${s}`);
    revalidatePath(`/films/${s}/lists`);
  }
}

function normalizeTags(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    const x = t.trim();
    if (!x) continue;
    const slice = x.slice(0, TAG_MAX_LEN);
    const key = slice.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(slice);
    if (out.length >= 10) break;
  }
  return out;
}

export async function listMyStockListsForPicker(): Promise<StockListPickerRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("stock_list_summaries_for_user");
  if (error) {
    console.error("[listMyStockListsForPicker]", error.message);
    return [];
  }
  const rows = (data ?? []) as {
    list_id: string;
    list_title: string;
    item_count: number | string;
  }[];
  return rows.map((r) => ({
    id: r.list_id,
    title: r.list_title,
    itemCount: Number(r.item_count),
  }));
}

export type CreateStockListResult =
  | { ok: true; listId: string }
  | { ok: false; error: "sign_in_required" | "validation" | string };

export async function createStockList(
  title: string,
  description: string | null,
  tags: string[],
  orderedSlugs: string[]
): Promise<CreateStockListResult> {
  const t = title?.trim() ?? "";
  if (!t || t.length > TITLE_MAX) return { ok: false, error: "validation" };
  const desc = description?.trim() ? description.trim().slice(0, DESC_MAX) : null;
  const tagArr = normalizeTags(tags);
  const slugs = [...new Set(orderedSlugs.map((s) => s.trim()).filter(Boolean))];
  if (slugs.length === 0) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: listRow, error: insErr } = await supabase
    .from("stock_lists")
    .insert({
      user_id: user.id,
      title: t,
      description: desc,
      tags: tagArr,
    })
    .select("id")
    .single();

  if (insErr || !listRow) {
    console.error("[createStockList]", insErr?.message);
    return { ok: false, error: insErr?.message ?? "insert_failed" };
  }

  const listId = listRow.id as string;
  const items = slugs.map((slug, i) => ({
    list_id: listId,
    film_stock_slug: slug,
    sort_order: i,
  }));

  const { error: itemsErr } = await supabase.from("stock_list_items").insert(items);
  if (itemsErr) {
    console.error("[createStockList] items", itemsErr.message);
    await supabase.from("stock_lists").delete().eq("id", listId);
    return { ok: false, error: itemsErr.message };
  }

  revalidateListPaths(listId, slugs);
  return { ok: true, listId };
}

export type MutationResult =
  | { ok: true }
  | { ok: false; error: "sign_in_required" | "not_found" | "forbidden" | "validation" | string };

export async function updateStockListMeta(
  listId: string,
  title: string,
  description: string | null,
  tags: string[]
): Promise<MutationResult> {
  const id = listId?.trim();
  if (!id) return { ok: false, error: "validation" };
  const t = title?.trim() ?? "";
  if (!t || t.length > TITLE_MAX) return { ok: false, error: "validation" };
  const desc = description?.trim() ? description.trim().slice(0, DESC_MAX) : null;
  const tagArr = normalizeTags(tags);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data, error } = await supabase
    .from("stock_lists")
    .update({ title: t, description: desc, tags: tagArr })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[updateStockListMeta]", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };

  revalidateListPaths(id);
  return { ok: true };
}

export async function replaceStockListItems(listId: string, orderedSlugs: string[]): Promise<MutationResult> {
  const id = listId?.trim();
  if (!id) return { ok: false, error: "validation" };
  const slugs = [...new Set(orderedSlugs.map((s) => s.trim()).filter(Boolean))];
  if (slugs.length === 0) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: own } = await supabase.from("stock_lists").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!own) return { ok: false, error: "not_found" };

  const { error: delErr } = await supabase.from("stock_list_items").delete().eq("list_id", id);
  if (delErr) {
    console.error("[replaceStockListItems] delete", delErr.message);
    return { ok: false, error: delErr.message };
  }

  const items = slugs.map((slug, i) => ({
    list_id: id,
    film_stock_slug: slug,
    sort_order: i,
  }));
  const { error: insErr } = await supabase.from("stock_list_items").insert(items);
  if (insErr) {
    console.error("[replaceStockListItems] insert", insErr.message);
    return { ok: false, error: insErr.message };
  }

  revalidateListPaths(id, slugs);
  return { ok: true };
}

export async function deleteStockList(listId: string): Promise<MutationResult> {
  const id = listId?.trim();
  if (!id) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: items } = await supabase.from("stock_list_items").select("film_stock_slug").eq("list_id", id);
  const slugs = (items ?? []).map((r: { film_stock_slug: string }) => r.film_stock_slug);

  const { error } = await supabase.from("stock_lists").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("[deleteStockList]", error.message);
    return { ok: false, error: error.message };
  }

  revalidateListPaths(id, slugs);
  return { ok: true };
}

export type AddStockToListResult = MutationResult | { ok: false; error: "duplicate" };

export async function addStockToList(listId: string, filmStockSlug: string): Promise<AddStockToListResult> {
  const id = listId?.trim();
  const slug = filmStockSlug?.trim();
  if (!id || !slug) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: own } = await supabase.from("stock_lists").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!own) return { ok: false, error: "not_found" };

  const { data: existing } = await supabase
    .from("stock_list_items")
    .select("sort_order")
    .eq("list_id", id)
    .eq("film_stock_slug", slug)
    .maybeSingle();
  if (existing) return { ok: false, error: "duplicate" };

  const { data: maxRow } = await supabase
    .from("stock_list_items")
    .select("sort_order")
    .eq("list_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = maxRow ? Number((maxRow as { sort_order: number }).sort_order) + 1 : 0;

  const { error } = await supabase.from("stock_list_items").insert({
    list_id: id,
    film_stock_slug: slug,
    sort_order: nextOrder,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "duplicate" };
    console.error("[addStockToList]", error.message);
    return { ok: false, error: error.message };
  }

  revalidateListPaths(id, [slug]);
  return { ok: true };
}

export async function saveStockListBookmark(listId: string): Promise<MutationResult> {
  const id = listId?.trim();
  if (!id) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: list } = await supabase.from("stock_lists").select("user_id").eq("id", id).maybeSingle();
  if (!list) return { ok: false, error: "not_found" };
  if ((list as { user_id: string }).user_id === user.id) return { ok: false, error: "forbidden" };

  const { error } = await supabase.from("saved_stock_lists").insert({ user_id: user.id, list_id: id });
  if (error) {
    if (error.code === "23505") return { ok: true };
    if (error.code === "23514") return { ok: false, error: "forbidden" };
    console.error("[saveStockListBookmark]", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath(`/lists/${id}`);
  return { ok: true };
}

export async function unsaveStockListBookmark(listId: string): Promise<MutationResult> {
  const id = listId?.trim();
  if (!id) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { error } = await supabase.from("saved_stock_lists").delete().eq("user_id", user.id).eq("list_id", id);
  if (error) {
    console.error("[unsaveStockListBookmark]", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath(`/lists/${id}`);
  return { ok: true };
}

export type StockListDetailPayload =
  | {
      ok: true;
      list: {
        id: string;
        title: string;
        description: string | null;
        tags: string[];
        updatedAt: string;
        ownerUserId: string;
      };
      orderedSlugs: string[];
    }
  | { ok: false; error: "not_found" };

export async function getStockListDetailForViewer(listId: string): Promise<StockListDetailPayload> {
  const id = listId?.trim();
  if (!id) return { ok: false, error: "not_found" };

  const supabase = await createClient();
  const { data: list, error: lErr } = await supabase
    .from("stock_lists")
    .select("id, title, description, tags, updated_at, user_id")
    .eq("id", id)
    .maybeSingle();

  if (lErr || !list) return { ok: false, error: "not_found" };

  const { data: items, error: iErr } = await supabase
    .from("stock_list_items")
    .select("film_stock_slug, sort_order")
    .eq("list_id", id)
    .order("sort_order", { ascending: true });

  if (iErr) {
    console.error("[getStockListDetailForViewer] items", iErr.message);
    return { ok: false, error: "not_found" };
  }

  const orderedSlugs = (items ?? []).map((r: { film_stock_slug: string }) => r.film_stock_slug);

  return {
    ok: true,
    list: {
      id: list.id as string,
      title: list.title as string,
      description: (list.description as string | null) ?? null,
      tags: Array.isArray(list.tags) ? (list.tags as string[]) : [],
      updatedAt: list.updated_at as string,
      ownerUserId: list.user_id as string,
    },
    orderedSlugs,
  };
}

export async function fetchStockListsForFilmPage(
  filmStockSlug: string,
  limit: number
): Promise<StockListFilmRow[]> {
  const slug = filmStockSlug?.trim();
  if (!slug) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("stock_lists_containing_film", {
    p_slug: slug,
    p_limit: limit,
  });

  if (error) {
    console.error("[fetchStockListsForFilmPage]", error.message);
    return [];
  }

  const rows = (data ?? []) as {
    list_id: string;
    list_title: string;
    updated_at: string;
    owner_user_id: string;
  }[];

  if (rows.length === 0) return [];

  const ownerIds = [...new Set(rows.map((r) => r.owner_user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ownerIds);

  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    const id = (p as { id: string }).id;
    const dn = (p as { display_name: string | null }).display_name?.trim();
    nameById.set(id, dn || "Member");
  }

  return rows.map((r) => ({
    listId: r.list_id,
    title: r.list_title,
    updatedAt: r.updated_at,
    ownerUserId: r.owner_user_id,
    ownerDisplayName: nameById.get(r.owner_user_id) ?? "Member",
  }));
}
