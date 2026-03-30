"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_FULL_NAME = 80;
const MAX_BIO = 160;

export type UpdateProfileSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileSettings(form: {
  fullName: string;
  bio: string;
}): Promise<UpdateProfileSettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const fullNameTrimmed = form.fullName.trim().slice(0, MAX_FULL_NAME);
  const full_name = fullNameTrimmed.length === 0 ? null : fullNameTrimmed;
  const bio = form.bio.trim().slice(0, MAX_BIO);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      bio: bio.length > 0 ? bio : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfileSettings]", error.message);
    return { ok: false, error: error.message };
  }

  const { data: row } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  const handle = row?.display_name?.trim() || user.email?.split("@")[0] || "";
  await supabase.auth.updateUser({
    data: {
      full_name: full_name ?? handle,
    },
  });

  return { ok: true };
}
