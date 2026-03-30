"use server";

import { createClient } from "@/lib/supabase/server";

function uniqueIds(ids: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) {
    const t = id?.trim();
    if (t) seen.add(t);
  }
  return [...seen];
}

/** Which of the given user ids the current user follows (empty if signed out). */
export async function getFollowingIdsAmong(targetUserIds: string[]): Promise<string[]> {
  const ids = uniqueIds(targetUserIds);
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .in("following_id", ids);

  if (error) {
    console.error("[getFollowingIdsAmong]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.following_id as string);
}

export type ToggleFollowUserResult =
  | { ok: true; following: boolean }
  | { ok: false; error: "sign_in_required" | "invalid_user" | "cannot_follow_self" | string };

export async function toggleFollowUser(followingId: string): Promise<ToggleFollowUserResult> {
  const id = followingId?.trim();
  if (!id) return { ok: false, error: "invalid_user" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in_required" };

  if (user.id === id) return { ok: false, error: "cannot_follow_self" };

  const { data: existing, error: selErr } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", id)
    .maybeSingle();

  if (selErr) {
    console.error("[toggleFollowUser] select", selErr.message);
    return { ok: false, error: selErr.message };
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", id);
    if (delErr) {
      console.error("[toggleFollowUser] delete", delErr.message);
      return { ok: false, error: delErr.message };
    }
    return { ok: true, following: false };
  }

  const { error: insErr } = await supabase.from("user_follows").insert({
    follower_id: user.id,
    following_id: id,
  });
  if (insErr) {
    console.error("[toggleFollowUser] insert", insErr.message);
    return { ok: false, error: insErr.message };
  }
  return { ok: true, following: true };
}
