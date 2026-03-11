import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createSupabaseClient(url, key);
  return _client;
}

/** For auth and client components: returns a Supabase client or throws if env not set. */
export function createClient(): SupabaseClient {
  const c = getSupabaseClient();
  if (!c) throw new Error("Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  return c;
}

/**
 * Lazy Supabase client: only created when env vars are set.
 * Safe to import during build (e.g. on Vercel without env); actual use happens at runtime when useSupabase() is true.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const c = getSupabaseClient();
    if (!c) return undefined;
    return (c as unknown as Record<string | symbol, unknown>)[prop];
  },
});
