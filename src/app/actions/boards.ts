"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BoardSummaryRow = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  itemCount: number;
  coverUrl: string | null;
  coverUrl2: string | null;
  coverUrl3: string | null;
};

export type BoardPageItem = {
  savedUploadId: string;
  uploadId: string;
  filmStockSlug: string;
  imageUrl: string | null;
  caption: string | null;
  addedAt: string;
};

export type BoardPageAvailableRow = {
  savedUploadId: string;
  uploadId: string;
  filmStockSlug: string;
  imageUrl: string | null;
  caption: string | null;
  savedAt: string;
};

export type BoardPagePayload =
  | {
      ok: true;
      board: { id: string; name: string; description: string | null };
      items: BoardPageItem[];
      availableToAdd: BoardPageAvailableRow[];
    }
  | { ok: false; error: "sign_in_required" | "not_found" | string };

function revalidateBoardPaths() {
  revalidatePath("/profile");
  revalidatePath("/profile/boards/all");
}

export async function userHasBoards(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { count, error } = await supabase
    .from("boards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (error) {
    console.error("[userHasBoards]", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

export type BoardMutationResult =
  | { ok: true; boardId?: string }
  | { ok: false; error: "sign_in_required" | "validation" | "not_found" | string };

export async function createBoard(name: string, description: string | null): Promise<BoardMutationResult> {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const desc = description?.trim() ? description.trim() : null;
  const { data, error } = await supabase
    .from("boards")
    .insert({ user_id: user.id, name: trimmed, description: desc })
    .select("id")
    .single();

  if (error) {
    console.error("[createBoard]", error.message);
    return { ok: false, error: error.message };
  }
  revalidateBoardPaths();
  revalidatePath(`/profile/boards/${data.id}`);
  return { ok: true, boardId: data.id as string };
}

export async function updateBoard(
  boardId: string,
  name: string,
  description: string | null
): Promise<BoardMutationResult> {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return { ok: false, error: "validation" };
  const id = boardId?.trim();
  if (!id) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const desc = description?.trim() ? description.trim() : null;
  const { data, error } = await supabase
    .from("boards")
    .update({ name: trimmed, description: desc })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[updateBoard]", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };
  revalidateBoardPaths();
  revalidatePath(`/profile/boards/${id}`);
  return { ok: true, boardId: id };
}

export async function deleteBoard(boardId: string): Promise<BoardMutationResult> {
  const id = boardId?.trim();
  if (!id) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { error } = await supabase.from("boards").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("[deleteBoard]", error.message);
    return { ok: false, error: error.message };
  }
  revalidateBoardPaths();
  return { ok: true };
}

export type AddToBoardResult =
  | { ok: true; boardName: string }
  | { ok: false; error: "sign_in_required" | "not_found" | "duplicate" | string };

export async function addUploadToBoard(boardId: string, uploadId: string): Promise<AddToBoardResult> {
  const bId = boardId?.trim();
  const uId = uploadId?.trim();
  if (!bId || !uId) return { ok: false, error: "not_found" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: boardRow, error: boardErr } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", bId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (boardErr || !boardRow) {
    return { ok: false, error: "not_found" };
  }

  const { data: su, error: suErr } = await supabase
    .from("saved_uploads")
    .select("id")
    .eq("user_id", user.id)
    .eq("upload_id", uId)
    .maybeSingle();
  if (suErr || !su) return { ok: false, error: "not_found" };

  const { error: insErr } = await supabase.from("board_items").insert({
    board_id: bId,
    saved_upload_id: su.id as string,
  });
  if (insErr) {
    if (insErr.code === "23505") return { ok: false, error: "duplicate" };
    console.error("[addUploadToBoard]", insErr.message);
    return { ok: false, error: insErr.message };
  }
  revalidateBoardPaths();
  revalidatePath(`/profile/boards/${bId}`);
  return { ok: true, boardName: boardRow.name as string };
}

export type RemoveFromBoardResult = { ok: true } | { ok: false; error: string };

export async function removeSavedUploadsFromBoard(
  boardId: string,
  savedUploadIds: string[]
): Promise<RemoveFromBoardResult> {
  const bId = boardId?.trim();
  if (!bId || savedUploadIds.length === 0) return { ok: false, error: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: own } = await supabase.from("boards").select("id").eq("id", bId).eq("user_id", user.id).maybeSingle();
  if (!own) return { ok: false, error: "not_found" };

  const { error } = await supabase
    .from("board_items")
    .delete()
    .eq("board_id", bId)
    .in("saved_upload_id", savedUploadIds);

  if (error) {
    console.error("[removeSavedUploadsFromBoard]", error.message);
    return { ok: false, error: error.message };
  }
  revalidateBoardPaths();
  revalidatePath(`/profile/boards/${bId}`);
  return { ok: true };
}

export async function getBoardPagePayload(boardId: string): Promise<BoardPagePayload> {
  const id = boardId?.trim();
  if (!id) return { ok: false, error: "not_found" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: board, error: bErr } = await supabase
    .from("boards")
    .select("id, name, description")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (bErr || !board) return { ok: false, error: "not_found" };

  const { data: itemRows, error: iErr } = await supabase
    .from("board_items")
    .select(
      "created_at, saved_upload_id, saved_uploads ( id, upload_id, user_uploads ( id, film_stock_slug, image_url, caption ) )"
    )
    .eq("board_id", id)
    .order("created_at", { ascending: false });

  if (iErr) {
    console.error("[getBoardPagePayload] items", iErr.message);
    return { ok: false, error: iErr.message };
  }

  const inBoardSavedIds = new Set<string>();
  const items: BoardPageItem[] = [];
  for (const row of itemRows ?? []) {
    const raw = row.saved_uploads;
    const su = Array.isArray(raw) ? raw[0] : raw;
    if (!su) continue;
    const upRaw = su.user_uploads;
    const up = Array.isArray(upRaw) ? upRaw[0] : upRaw;
    if (!up) continue;
    const sid = row.saved_upload_id as string;
    inBoardSavedIds.add(sid);
    items.push({
      savedUploadId: sid,
      uploadId: (su.upload_id as string) ?? up.id,
      filmStockSlug: up.film_stock_slug as string,
      imageUrl: up.image_url as string | null,
      caption: up.caption as string | null,
      addedAt: row.created_at as string,
    });
  }

  const { data: savedRows, error: sErr } = await supabase
    .from("saved_uploads")
    .select("id, created_at, user_uploads ( id, film_stock_slug, image_url, caption )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sErr) {
    console.error("[getBoardPagePayload] saved", sErr.message);
    return { ok: false, error: sErr.message };
  }

  const availableToAdd: BoardPageAvailableRow[] = [];
  for (const row of savedRows ?? []) {
    const sid = row.id as string;
    if (inBoardSavedIds.has(sid)) continue;
    const raw = row.user_uploads;
    const up = Array.isArray(raw) ? raw[0] : raw;
    if (!up) continue;
    availableToAdd.push({
      savedUploadId: sid,
      uploadId: up.id as string,
      filmStockSlug: up.film_stock_slug as string,
      imageUrl: up.image_url as string | null,
      caption: up.caption as string | null,
      savedAt: row.created_at as string,
    });
  }

  return {
    ok: true,
    board: {
      id: board.id as string,
      name: board.name as string,
      description: (board.description as string | null) ?? null,
    },
    items,
    availableToAdd,
  };
}

export type UserBoardPickerRow = { id: string; name: string; itemCount: number };

export async function listBoardsForPicker(): Promise<UserBoardPickerRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("board_summaries_for_user");
  if (error) {
    console.error("[listBoardsForPicker]", error.message);
    return [];
  }
  return (data ?? []).map(
    (r: {
      board_id: string;
      board_name: string;
      item_count: number | string;
    }) => ({
      id: r.board_id,
      name: r.board_name,
      itemCount: Number(r.item_count),
    })
  );
}
