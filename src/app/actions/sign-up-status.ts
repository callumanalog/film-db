"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

const THROTTLE_SECONDS = 60;

export type SignUpStatusResult =
  | { status: "new" }
  | { status: "existing_verified" }
  | { status: "existing_unverified" }
  | { status: "throttled"; message: string }
  | { status: "error"; message: string };

/**
 * Checks if the email is already registered and returns the appropriate sign-up flow.
 * For unverified repeaters: updates the user (password, display_name) and profile (display_name, verification_email_sent_at).
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
    .select("email_verified_at, verification_email_sent_at")
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

  const now = new Date();
  const sentAt = profile.verification_email_sent_at
    ? new Date(profile.verification_email_sent_at)
    : null;
  if (sentAt && (now.getTime() - sentAt.getTime()) / 1000 < THROTTLE_SECONDS) {
    const waitSeconds = Math.ceil(THROTTLE_SECONDS - (now.getTime() - sentAt.getTime()) / 1000);
    return {
      status: "throttled",
      message: `Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before requesting another verification email.`,
    };
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
      verification_email_sent_at: now.toISOString(),
    })
    .eq("id", existingUser.id);
  if (updateProfileError) {
    console.error("[sign-up-status] update profile:", updateProfileError.message);
  }

  return { status: "existing_unverified" };
}

const THROTTLE_SECONDS_RESEND = 60;

export type RequestResendResult =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Checks throttle and records that a verification email is being sent.
 * Call this before calling supabase.auth.resend() from the verify-email page.
 */
export async function requestVerificationResend(email: string): Promise<RequestResendResult> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { allowed: false, message: "Email is required." };
  }

  const admin = await createServiceRoleClient();
  if (!admin) {
    return { allowed: true }; // No throttle when service role missing
  }

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    return { allowed: false, message: listError.message };
  }

  const user = listData?.users?.find((u) => u.email?.toLowerCase() === trimmedEmail);
  if (!user) {
    return { allowed: true };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("verification_email_sent_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { allowed: true };
  }

  const now = new Date();
  const sentAt = profile.verification_email_sent_at
    ? new Date(profile.verification_email_sent_at)
    : null;
  if (sentAt && (now.getTime() - sentAt.getTime()) / 1000 < THROTTLE_SECONDS_RESEND) {
    const waitSeconds = Math.ceil(
      THROTTLE_SECONDS_RESEND - (now.getTime() - sentAt.getTime()) / 1000
    );
    return {
      allowed: false,
      message: `Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before requesting another email.`,
    };
  }

  await admin
    .from("profiles")
    .update({ verification_email_sent_at: now.toISOString() })
    .eq("id", user.id);

  return { allowed: true };
}

/**
 * Records that a verification email was just sent (e.g. after initial signUp).
 * Call this after successful signUp so the verify-email page resend is throttled.
 */
export async function recordVerificationEmailSent(email: string): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return;

  const admin = await createServiceRoleClient();
  if (!admin) return;

  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = listData?.users?.find((u) => u.email?.toLowerCase() === trimmedEmail);
  if (!user) return;

  await admin
    .from("profiles")
    .update({ verification_email_sent_at: new Date().toISOString() })
    .eq("id", user.id);
}
