"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export type SignUpStatusResult =
  | { status: "new" }
  | { status: "existing_verified" }
  | { status: "existing_unverified" }
  | { status: "error"; message: string };

/**
 * Checks if the email is already registered and returns the appropriate sign-up flow.
 * For unverified repeaters: updates the user (password, display_name) and profile (display_name, email).
 * Caller is responsible for triggering the verification email (resend) and redirect.
 */
export async function getSignUpStatus(
  email: string,
  password: string,
  displayName: string
): Promise<SignUpStatusResult> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { status: "error", message: "Email is required." };
  }

  const admin = await createServiceRoleClient();
  if (!admin) {
    // No service role key: skip existing-user check and proceed as new (signUp will run; if email exists, Supabase will error and client can redirect to sign-in).
    return { status: "new" };
  }

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("[sign-up-status] listUsers:", listError.message);
    return { status: "error", message: listError.message };
  }

  const existingUser = listData?.users?.find((u) => u.email?.toLowerCase() === trimmedEmail);
  if (!existingUser) {
    return { status: "new" };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("email_verified_at")
    .eq("id", existingUser.id)
    .single();

  if (profileError || !profile) {
    return { status: "new" };
  }

  // Treat as verified if our profile says so, or if Supabase Auth has already confirmed the email (e.g. old users or pre-migration).
  const authConfirmed = !!existingUser.email_confirmed_at;
  if (profile.email_verified_at || authConfirmed) {
    return { status: "existing_verified" };
  }

  const { error: updateUserError } = await admin.auth.admin.updateUserById(existingUser.id, {
    password,
    user_metadata: { display_name: displayName || undefined },
  });
  if (updateUserError) {
    console.error("[sign-up-status] updateUserById:", updateUserError.message);
    return { status: "error", message: updateUserError.message };
  }

  const { error: updateProfileError } = await admin
    .from("profiles")
    .update({
      display_name: displayName.trim() || (existingUser.email?.split("@")[0] ?? ""),
      email: existingUser.email ?? null,
    })
    .eq("id", existingUser.id);
  if (updateProfileError) {
    console.error("[sign-up-status] update profile:", updateProfileError.message);
  }

  return { status: "existing_unverified" };
}

export type RequestResendResult =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Call before supabase.auth.resend() from the verify-email page. No rate limit; always allows.
 */
export async function requestVerificationResend(email: string): Promise<RequestResendResult> {
  if (!email?.trim()) {
    return { allowed: false, message: "Email is required." };
  }
  return { allowed: true };
}
