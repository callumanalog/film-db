const MAX_TOAST_DETAIL_LEN = 280;

/** Vercel / CDN 413 or body limit failures (response may be non-JSON). */
export const REVIEWS_PAYLOAD_TOO_LARGE_TOAST =
  "Upload was too large for the server. Try again with fewer photos — they are optimized automatically before upload.";

/** User-facing line from API JSON (`error` + optional `detail`), truncated. */
export function apiErrorMessageForToast(data: Record<string, unknown>): string {
  const err = typeof data.error === "string" ? data.error.trim() : "";
  const det = typeof data.detail === "string" ? data.detail.trim() : "";
  const joined = [err, det].filter(Boolean).join(" ");
  if (!joined) return "Something went wrong. Please try again.";
  return joined.length > MAX_TOAST_DETAIL_LEN
    ? `${joined.slice(0, MAX_TOAST_DETAIL_LEN)}…`
    : joined;
}

export function networkErrorToastMessage(): string {
  return "Network error — check your connection and try again.";
}

/**
 * Maps failed review POST/PATCH HTTP responses to a toast line (handles empty JSON on 413).
 */
export function toastMessageForReviewsHttpFailure(
  res: Response,
  data: Record<string, unknown>,
  rawBody: string
): string {
  if (res.status === 413) return REVIEWS_PAYLOAD_TOO_LARGE_TOAST;
  const combined = `${rawBody} ${typeof data.error === "string" ? data.error : ""} ${
    typeof data.detail === "string" ? data.detail : ""
  }`.toLowerCase();
  if (
    res.status >= 400 &&
    (/payload too large|function_payload_too_large|body exceeded|request entity too large/i.test(combined) ||
      /413/.test(combined))
  ) {
    return REVIEWS_PAYLOAD_TOO_LARGE_TOAST;
  }
  const fromJson = apiErrorMessageForToast(data);
  if (fromJson !== "Something went wrong. Please try again.") return fromJson;
  if (res.status >= 500) return "Server error — please try again in a moment.";
  return fromJson;
}

export type InterpretReviewsPostContext = {
  mode: "review" | "upload";
  fileCount: number;
  usedPreUploadedUrl: boolean;
};

/**
 * Interprets POST `/api/user/reviews` JSON after a successful HTTP status.
 * Fails closed when files were sent but `uploaded` is 0.
 */
export function interpretReviewsPostResult(
  data: Record<string, unknown>,
  ctx: InterpretReviewsPostContext
): { ok: true; uploaded: number; reviewSaved: boolean; uploadFailed?: number } | { ok: false; message: string } {
  const uploaded = Number(data.uploaded) || 0;
  const reviewSaved = Boolean(data.reviewSaved);
  const uploadFailed = typeof data.uploadFailed === "number" ? data.uploadFailed : 0;
  const expectedUpload = ctx.fileCount > 0 || ctx.usedPreUploadedUrl;

  if (expectedUpload && uploaded === 0) {
    return {
      ok: false,
      message:
        "Your photos could not be saved after uploading. Try again, or contact support if this continues.",
    };
  }

  if (expectedUpload && uploadFailed > 0) {
    return { ok: true, uploaded, reviewSaved, uploadFailed };
  }

  return { ok: true, uploaded, reviewSaved };
}
