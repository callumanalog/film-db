/** Public product name (user-facing copy, metadata, emails). */
export const SITE_NAME = "Exposure Club";

/**
 * Canonical site origin for metadata, sitemap, and Open Graph.
 * Set `NEXT_PUBLIC_APP_URL` in production (e.g. https://exposureclub.com).
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Optional support / legal contact (set `NEXT_PUBLIC_SUPPORT_EMAIL` in production). */
export function getSupportEmail(): string | undefined {
  const e = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return e || undefined;
}
