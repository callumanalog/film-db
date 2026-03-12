import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readFileSync } from "fs";
import { join } from "path";

function getEnvFromLocal(key: string): string | undefined {
  try {
    const path = join(process.cwd(), ".env.local");
    const content = readFileSync(path, "utf-8");
    const line = content
      .split("\n")
      .find((l) => l.startsWith(key + "=") && !l.trimStart().startsWith("#"));
    if (!line) return undefined;
    const value = line.slice(key.length + 1).trim();
    return value.replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? getEnvFromLocal("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    getEnvFromLocal("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured");
  }
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored when called from Server Component (read-only)
        }
      },
    },
  });
}
