"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchDisplayNamesByUserIds } from "@/lib/supabase/fetch-display-names-batch";

function uniqueUploadIds(ids: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) {
    const t = id?.trim();
    if (t) seen.add(t);
  }
  return [...seen];
}

/** Which of the given upload ids the current user has liked (empty if signed out). */
export async function getLikedUploadIdsAmong(uploadIds: string[]): Promise<string[]> {
  const ids = uniqueUploadIds(uploadIds);
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("upload_likes")
    .select("upload_id")
    .eq("user_id", user.id)
    .in("upload_id", ids);

  if (error) {
    console.error("[getLikedUploadIdsAmong]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.upload_id as string);
}

export type ToggleLikeUploadResult =
  | { ok: true; liked: boolean }
  | { ok: false; error: "sign_in_required" | "invalid_upload" | string };

export async function toggleLikeUpload(uploadId: string): Promise<ToggleLikeUploadResult> {
  const id = uploadId?.trim();
  if (!id) return { ok: false, error: "invalid_upload" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  const { data: existing, error: selErr } = await supabase
    .from("upload_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("upload_id", id)
    .maybeSingle();

  if (selErr) {
    console.error("[toggleLikeUpload] select", selErr.message);
    return { ok: false, error: selErr.message };
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("upload_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("upload_id", id);
    if (delErr) {
      console.error("[toggleLikeUpload] delete", delErr.message);
      return { ok: false, error: delErr.message };
    }
    return { ok: true, liked: false };
  }

  const { error: insErr } = await supabase.from("upload_likes").insert({
    user_id: user.id,
    upload_id: id,
  });
  if (insErr) {
    console.error("[toggleLikeUpload] insert", insErr.message);
    return { ok: false, error: insErr.message };
  }
  return { ok: true, liked: true };
}

export interface UploadLikerPreview {
  userId: string;
  displayName: string;
}

const LIKERS_MAX = 500;

/** Likers for an upload, newest first (for Likes sheet). */
export async function getLikersForUpload(
  uploadId: string,
  limit = 200
): Promise<UploadLikerPreview[]> {
  const id = uploadId?.trim();
  if (!id) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upload_likes")
    .select("user_id")
    .eq("upload_id", id)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(1, limit), LIKERS_MAX));

  if (error || !data?.length) {
    if (error) console.error("[getLikersForUpload]", error.message);
    return [];
  }

  const userIds = data.map((r) => r.user_id as string);
  const nameByUserId = await fetchDisplayNamesByUserIds(userIds);
  return userIds.map((userId) => ({
    userId,
    displayName: nameByUserId.get(userId)?.trim() || "Member",
  }));
}
