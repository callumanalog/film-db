const MAX_TOAST_DETAIL_LEN = 280;

/** Toast when share-a-roll submit fails (HTTP, network, timeout, or client guard). */
export const SHARE_ROLL_SUBMIT_ERROR_TOAST =
  "We couldn't share your roll at this time. Please try again.";

/** Toast when text review submit fails (HTTP, network, timeout, or client guard). */
export const REVIEW_POST_ERROR_TOAST =
  "We couldn't post your review at this time. Please try again.";

/** Toast when edit-roll PATCH fails (lightbox / metadata update). */
export const ROLL_UPDATE_ERROR_TOAST =
  "We couldn't update your roll at this time. Please try again.";

export function reviewsModalSubmitErrorToast(
  mode: "review" | "upload",
  method: "POST" | "PATCH"
): string {
  if (mode === "upload") {
    return method === "PATCH" ? ROLL_UPDATE_ERROR_TOAST : SHARE_ROLL_SUBMIT_ERROR_TOAST;
  }
  return REVIEW_POST_ERROR_TOAST;
}

/** User-facing line from API JSON (`error` + optional `detail`), truncated. Used outside modal submit. */
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
 * Maps failed review POST/PATCH from the add-review modal to a short, mode-specific toast.
 */
export function toastMessageForReviewsHttpFailure(
  _res: Response,
  _data: Record<string, unknown>,
  _rawBody: string,
  mode: "review" | "upload",
  method: "POST" | "PATCH"
): string {
  return reviewsModalSubmitErrorToast(mode, method);
}

export type InterpretReviewsPostContext = {
  mode: "review" | "upload";
  /** Pre-uploaded scans sent as `client_stored_images` (share-a-roll). */
  fileCount: number;
  /** Images the user intended to attach (defaults to fileCount). */
  attemptedUploads?: number;
};

/**
 * Interprets POST `/api/user/reviews` JSON after a successful HTTP status.
 * Fails closed when uploads were expected but `uploaded` is 0.
 */
export function interpretReviewsPostResult(
  data: Record<string, unknown>,
  ctx: InterpretReviewsPostContext
): { ok: true; uploaded: number; reviewSaved: boolean; uploadFailed?: number } | { ok: false; message: string } {
  const uploaded = Number(data.uploaded) || 0;
  const reviewSaved = Boolean(data.reviewSaved);
  const serverReportedFailed = typeof data.uploadFailed === "number" ? data.uploadFailed : 0;
  const expectedUpload = ctx.fileCount > 0;
  const attempted = ctx.attemptedUploads ?? ctx.fileCount;
  const gapFromCounts =
    attempted > 0 && uploaded < attempted ? Math.max(0, attempted - uploaded) : 0;
  const uploadFailed = Math.max(serverReportedFailed, gapFromCounts);

  if (expectedUpload && uploaded === 0) {
    return {
      ok: false,
      message: reviewsModalSubmitErrorToast(ctx.mode, "POST"),
    };
  }

  if (expectedUpload && uploadFailed > 0) {
    return { ok: true, uploaded, reviewSaved, uploadFailed };
  }

  return { ok: true, uploaded, reviewSaved };
}
