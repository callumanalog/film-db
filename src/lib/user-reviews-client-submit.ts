import type { AddReviewModalPayload } from "@/components/add-review-modal";
import { createClient } from "@/lib/supabase/client";
import type { PreparedShareRollImage } from "@/lib/share-roll-image";
import { SCAN_TILE_MSG_SIGN_IN, humanizeStorageUploadError } from "@/lib/share-roll-image-errors";
import { appendReviewsPayloadFields } from "@/lib/user-reviews-form-data";
import {
  reviewsModalSubmitErrorToast,
  toastMessageForReviewsHttpFailure,
} from "@/lib/review-submit-feedback";

const BUCKET = "user-uploads";

export async function fetchReviewsResponse(
  url: string,
  method: "POST" | "PATCH",
  formData: FormData,
  signal?: AbortSignal
): Promise<{ res: Response; data: Record<string, unknown>; rawText: string }> {
  const res = await fetch(url, { method, body: formData, signal });
  const rawText = await res.text();
  let data: Record<string, unknown> = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      /* non-JSON e.g. some 413 bodies */
    }
  }
  return { res, data, rawText };
}

export type ClientStoredScanRow = { url: string; width: number; height: number };

/**
 * Uploads one prepared scan blob to `user-uploads` under `{userId}/{filmStockSlug}/`.
 * @param imageIndexOneBased — used in humanized storage errors (e.g. “Image 2…”).
 */
export async function uploadPreparedShareRollScanToStorage(
  filmStockSlug: string,
  prepared: PreparedShareRollImage,
  imageIndexOneBased: number
): Promise<ClientStoredScanRow> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error(SCAN_TILE_MSG_SIGN_IN);
  }

  const prefix = `${user.id}/${filmStockSlug}`;
  const objectPath = `${prefix}/${Date.now()}-${imageIndexOneBased}-${Math.random().toString(36).slice(2, 10)}.${prepared.fileExtension}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, prepared.blob, {
    upsert: true,
    contentType: prepared.contentType,
  });
  if (upErr) {
    throw new Error(humanizeStorageUploadError(upErr.message || "Upload failed", imageIndexOneBased));
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { url: pub.publicUrl, width: prepared.width, height: prepared.height };
}

export type BuildUserReviewsFormDataOptions = {
  filmStockSlug: string;
  mode: "review" | "upload";
  payload: AddReviewModalPayload;
};

export type BuildUserReviewsFormDataResult = { formData: FormData };

export async function buildUserReviewsFormData(
  opts: BuildUserReviewsFormDataOptions
): Promise<BuildUserReviewsFormDataResult> {
  const { filmStockSlug, mode, payload } = opts;
  const formData = new FormData();
  appendReviewsPayloadFields(formData, filmStockSlug, mode, payload);

  if (payload.shareRollMetadataOnly) {
    formData.set("share_roll_metadata_only", "1");
    return { formData };
  }

  const preStoredFromPayload =
    payload.clientStoredScanImages && payload.clientStoredScanImages.length > 0
      ? payload.clientStoredScanImages
      : null;

  if (preStoredFromPayload) {
    formData.set(
      "client_stored_images",
      JSON.stringify(
        preStoredFromPayload.map((r) => ({
          url: r.url,
          width: r.width,
          height: r.height,
        }))
      )
    );
    return { formData };
  }

  if (payload.files.length > 0) {
    throw new Error(
      "Unexpected file attachments in review payload. Add images only via share-a-roll (pre-uploaded clientStoredScanImages)."
    );
  }

  return { formData };
}

export async function submitNewUserReview(opts: {
  filmStockSlug: string;
  mode: "review" | "upload";
  payload: AddReviewModalPayload;
  onProgress?: (label: string) => void;
  signal?: AbortSignal;
}): Promise<{ res: Response; data: Record<string, unknown>; rawText: string }> {
  const { formData } = await buildUserReviewsFormData({
    filmStockSlug: opts.filmStockSlug,
    mode: opts.mode,
    payload: opts.payload,
  });
  opts.onProgress?.(opts.mode === "upload" ? "Sharing…" : "Saving…");
  return fetchReviewsResponse("/api/user/reviews", "POST", formData, opts.signal);
}

/**
 * Full new-review POST — failures map to a short toast by modal mode (share-a-roll vs text review).
 */
export async function postReviewModalSubmission(opts: {
  filmStockSlug: string;
  mode: "review" | "upload";
  payload: AddReviewModalPayload;
  onProgress?: (label: string | null) => void;
  signal?: AbortSignal;
}): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; toast: string }> {
  try {
    const { res, data, rawText } = await submitNewUserReview({
      filmStockSlug: opts.filmStockSlug,
      mode: opts.mode,
      payload: opts.payload,
      onProgress: (label) => opts.onProgress?.(label),
      signal: opts.signal,
    });
    opts.onProgress?.(null);
    if (!res.ok) {
      return {
        ok: false,
        toast: toastMessageForReviewsHttpFailure(res, data, rawText, opts.mode, "POST"),
      };
    }
    return { ok: true, data };
  } catch {
    opts.onProgress?.(null);
    return { ok: false, toast: reviewsModalSubmitErrorToast(opts.mode, "POST") };
  }
}

export async function submitUserReviewPatch(opts: {
  reviewId: string;
  filmStockSlug: string;
  payload: AddReviewModalPayload;
  /** Use `"upload"` when patching share-roll fields (with `payload.shareRollMetadataOnly`). */
  mode?: "review" | "upload";
  onProgress?: (label: string) => void;
  signal?: AbortSignal;
}): Promise<{ res: Response; data: Record<string, unknown>; rawText: string }> {
  const { formData } = await buildUserReviewsFormData({
    filmStockSlug: opts.filmStockSlug,
    mode: opts.mode ?? "review",
    payload: opts.payload,
  });
  opts.onProgress?.("Saving…");
  return fetchReviewsResponse(`/api/user/reviews/${opts.reviewId}`, "PATCH", formData, opts.signal);
}

export async function patchReviewModalSubmission(opts: {
  reviewId: string;
  filmStockSlug: string;
  payload: AddReviewModalPayload;
  mode?: "review" | "upload";
  onProgress?: (label: string | null) => void;
  signal?: AbortSignal;
}): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; toast: string }> {
  const mode = opts.mode ?? "review";
  try {
    const { res, data, rawText } = await submitUserReviewPatch({
      reviewId: opts.reviewId,
      filmStockSlug: opts.filmStockSlug,
      payload: opts.payload,
      mode,
      onProgress: (label) => opts.onProgress?.(label),
      signal: opts.signal,
    });
    opts.onProgress?.(null);
    if (!res.ok) {
      return {
        ok: false,
        toast: toastMessageForReviewsHttpFailure(res, data, rawText, mode, "PATCH"),
      };
    }
    return { ok: true, data };
  } catch {
    opts.onProgress?.(null);
    return { ok: false, toast: reviewsModalSubmitErrorToast(mode, "PATCH") };
  }
}
