"use server";

import { Buffer } from "node:buffer";
import { createClient } from "@/lib/supabase/server";
import { normalizeInstagramInput, normalizeWebsiteInput } from "@/lib/profile-links";

const MAX_FULL_NAME = 80;
const MAX_BIO = 160;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UpdateProfileSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileSettings(form: {
  fullName: string;
  bio: string;
  instagram: string;
  websiteUrl: string;
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

  const ig = normalizeInstagramInput(form.instagram);
  if (!ig.ok) return { ok: false, error: ig.error };
  const web = normalizeWebsiteInput(form.websiteUrl);
  if (!web.ok) return { ok: false, error: web.error };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      bio: bio.length > 0 ? bio : null,
      instagram_url: ig.url,
      website_url: web.url,
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

export type UploadProfileAvatarResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

export async function uploadProfileAvatar(formData: FormData): Promise<UploadProfileAvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const file = formData.get("avatar");
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }
  if (!AVATAR_TYPES.has(file.type)) {
    return { ok: false, error: "Use JPEG, PNG, WebP, or GIF." };
  }

  const ext =
    file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "gif";
  const path = `${user.id}/avatar.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("user-uploads").upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) {
    console.error("[uploadProfileAvatar]", upErr.message);
    return { ok: false, error: upErr.message };
  }

  const { data: pub } = supabase.storage.from("user-uploads").getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbErr) {
    console.error("[uploadProfileAvatar] profiles", dbErr.message);
    return { ok: false, error: dbErr.message };
  }

  return { ok: true, publicUrl };
}

export async function clearProfileAvatar(): Promise<UpdateProfileSettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[clearProfileAvatar]", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
