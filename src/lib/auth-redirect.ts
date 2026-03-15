import type { ReadonlyURLSearchParams } from "next/navigation";

const DEFAULT_AFTER_SIGN_IN = "/profile";
const DEFAULT_AFTER_SIGN_UP = "/";

/**
 * Reads the post-auth redirect URL from search params.
 * Supports both `next` and `redirect_to` (e.g. from OAuth or magic link).
 */
export function getRedirectTo(searchParams: ReadonlyURLSearchParams | null): string {
  if (!searchParams) return DEFAULT_AFTER_SIGN_IN;
  const next = searchParams.get("next");
  const redirectTo = searchParams.get("redirect_to");
  const value = next ?? redirectTo ?? DEFAULT_AFTER_SIGN_IN;
  // Ensure we don't redirect to auth pages or external URLs
  if (value.startsWith("/auth/") || value.startsWith("http")) return DEFAULT_AFTER_SIGN_IN;
  return value;
}

/**
 * For sign-up flow, default to home unless coming from a specific page.
 */
export function getRedirectToSignUp(searchParams: ReadonlyURLSearchParams | null): string {
  if (!searchParams) return DEFAULT_AFTER_SIGN_UP;
  const next = searchParams.get("next");
  const redirectTo = searchParams.get("redirect_to");
  const value = next ?? redirectTo ?? DEFAULT_AFTER_SIGN_UP;
  if (value.startsWith("/auth/") || value.startsWith("http")) return DEFAULT_AFTER_SIGN_UP;
  return value;
}

/**
 * Origin to use for email links (verification, password reset).
 * Use NEXT_PUBLIC_APP_URL in production so links point to your site, not localhost.
 */
export function getEmailRedirectOrigin(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "";
}

/** Build callback URL with redirect param for email/OAuth. */
export function buildCallbackUrl(redirectTo: string, origin: string): string {
  const path = `/auth/callback?next=${encodeURIComponent(redirectTo)}`;
  return `${origin}${path}`;
}
