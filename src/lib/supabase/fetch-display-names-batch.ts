import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Resolve display_name for many users at once for public UI (Discover, Community, review authors).
 * Uses the service role client when configured so RLS on `profiles` (self-read only) does not hide
 * other members' usernames. Falls back to the user session client if service role is unavailable.
 */
export async function fetchDisplayNamesByUserIds(userIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, string | null>();
  if (unique.length === 0) return out;

  const sr = await createServiceRoleClient();
  const supabase = sr ?? (await createClient());

  const { data, error } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  if (error) {
    console.error("[fetchDisplayNamesByUserIds]", error.message);
    return out;
  }
  for (const p of data ?? []) {
    out.set(p.id, p.display_name ?? null);
  }
  return out;
}

export type MemberPublicFields = {
  displayName: string | null;
  avatarUrl: string | null;
};

/** Display name + avatar for feed and lists (same RLS/service-role pattern as display names). */
export async function fetchMemberPublicFieldsByUserIds(
  userIds: string[]
): Promise<Map<string, MemberPublicFields>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, MemberPublicFields>();
  if (unique.length === 0) return out;

  const sr = await createServiceRoleClient();
  const supabase = sr ?? (await createClient());

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", unique);
  if (error) {
    console.error("[fetchMemberPublicFieldsByUserIds]", error.message);
    return out;
  }
  for (const p of data ?? []) {
    const row = p as { id: string; display_name: string | null; avatar_url: string | null };
    const av = row.avatar_url?.trim() ? row.avatar_url.trim() : null;
    out.set(row.id, { displayName: row.display_name ?? null, avatarUrl: av });
  }
  return out;
}
