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
