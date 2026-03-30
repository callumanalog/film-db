"use server";

import { createClient } from "@/lib/supabase/server";

function uniqueUploadIds(ids: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) {
    const t = id?.trim();
    if (t) seen.add(t);
  }
  return [...seen];
}

/** Which of the given upload ids the current user has saved (empty if signed out). */
export async function getSavedUploadIdsAmong(uploadIds: string[]): Promise<string[]> {
  const ids = uniqueUploadIds(uploadIds);
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_uploads")
    .select("upload_id")
    .eq("user_id", user.id)
    .in("upload_id", ids);

  if (error) {
    console.error("[getSavedUploadIdsAmong]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.upload_id as string);
}

export type ToggleSaveUploadResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: "sign_in_required" | "invalid_upload" | string };

/** Save or unsave a single community upload for the current user. */
export async function toggleSaveUpload(uploadId: string): Promise<ToggleSaveUploadResult> {
  const id = uploadId?.trim();
  if (!id) return { ok: false, error: "invalid_upload" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: existing, error: selErr } = await supabase
    .from("saved_uploads")
    .select("id")
    .eq("user_id", user.id)
    .eq("upload_id", id)
    .maybeSingle();

  if (selErr) {
    console.error("[toggleSaveUpload] select", selErr.message);
    return { ok: false, error: selErr.message };
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("saved_uploads")
      .delete()
      .eq("user_id", user.id)
      .eq("upload_id", id);
    if (delErr) {
      console.error("[toggleSaveUpload] delete", delErr.message);
      return { ok: false, error: delErr.message };
    }
    return { ok: true, saved: false };
  }

  const { error: insErr } = await supabase.from("saved_uploads").insert({
    user_id: user.id,
    upload_id: id,
  });
  if (insErr) {
    console.error("[toggleSaveUpload] insert", insErr.message);
    return { ok: false, error: insErr.message };
  }
  return { ok: true, saved: true };
}
