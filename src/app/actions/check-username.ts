"use server";

import { createClient } from "@/lib/supabase/server";

/** Returns true if the username (display_name) is available, false if taken. */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const trimmed = username.trim();
  if (!trimmed) return true;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_username_available", {
      p_display_name: trimmed,
    });
    if (error) {
      console.error("[check-username]", error.message);
      return true; // assume available on error so sign-up can continue
    }
    return data === true;
  } catch {
    return true;
  }
}
