import type { AddReviewModalPayload } from "@/components/add-review-modal";
import { createClient } from "@/lib/supabase/client";
import { prepareShareRollImageFile, type PreparedShareRollImage } from "@/lib/share-roll-image";
import {
  humanizeImagePrepareError,
  humanizeStorageUploadError,
} from "@/lib/share-roll-image-errors";
import { appendReviewsPayloadFields } from "@/lib/user-reviews-form-data";
import {
  networkErrorToastMessage,
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

export type ClientUploadReviewFailure = { index: number; message: string };

export type ClientUploadReviewImagesResult = {
  rows: { url: string; width: number; height: number }[];
  failures: ClientUploadReviewFailure[];
};

/**
 * Encodes and uploads roll/review photos to Supabase from the browser (avoids Vercel body limits).
 * Processes one file at a time; failures are collected so other photos still upload.
 */
export async function clientUploadReviewImages(
  filmStockSlug: string,
  files: File[],
  onProgress?: (label: string) => void,
  /** When length matches `files`, skips canvas re-encode (already done at pick time). */
  preparedRows?: PreparedShareRollImage[] | null
): Promise<ClientUploadReviewImagesResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("You must be signed in to upload photos.");
  }

  const prefix = `${user.id}/${filmStockSlug}`;
  const rows: { url: string; width: number; height: number }[] = [];
  const failures: ClientUploadReviewFailure[] = [];
  const n = files.length;

  for (let i = 0; i < n; i++) {
    const file = files[i]!;
    const oneBased = i + 1;
    const hasPrepared =
      preparedRows &&
      preparedRows.length === files.length &&
      preparedRows[i]?.blob &&
      preparedRows[i]!.blob.size > 0;

    let prepared: PreparedShareRollImage;
    try {
      if (!hasPrepared) {
        onProgress?.(`Compressing photo ${oneBased} of ${n}…`);
      }
      prepared = hasPrepared ? preparedRows[i]! : await prepareShareRollImageFile(file);
    } catch (e) {
      failures.push({
        index: i,
        message: humanizeImagePrepareError(e, file.name),
      });
      continue;
    }

    onProgress?.(`Uploading photo ${oneBased} of ${n}…`);
    const objectPath = `${prefix}/${Date.now()}-${i}.${prepared.fileExtension}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, prepared.blob, {
      upsert: true,
      contentType: prepared.contentType,
    });
    if (upErr) {
      failures.push({
        index: i,
        message: humanizeStorageUploadError(upErr.message || "Upload failed", oneBased),
      });
      continue;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    rows.push({ url: pub.publicUrl, width: prepared.width, height: prepared.height });
  }

  return { rows, failures };
}

export type BuildUserReviewsFormDataOptions = {
  filmStockSlug: string;
  mode: "review" | "upload";
  payload: AddReviewModalPayload;
  /** When set, skips multipart files and sends this JSON (already-uploaded public URLs). */
  clientStoredImages?: { url: string; width: number; height: number }[];
  onProgress?: (label: string) => void;
};

export type BuildUserReviewsFormDataResult = {
  formData: FormData;
  /** Set when some (not all) client-side uploads failed before the API call. */
  clientUploadFailures?: ClientUploadReviewFailure[];
};

export async function buildUserReviewsFormData(
  opts: BuildUserReviewsFormDataOptions
): Promise<BuildUserReviewsFormDataResult> {
  const { filmStockSlug, mode, payload, clientStoredImages, onProgress } = opts;
  const formData = new FormData();
  appendReviewsPayloadFields(formData, filmStockSlug, mode, payload);

  const usedPreUpload = mode === "upload" && !!payload.uploadedImageUrl;

  if (clientStoredImages && clientStoredImages.length > 0) {
    formData.set(
      "client_stored_images",
      JSON.stringify(
        clientStoredImages.map((r) => ({
          url: r.url,
          width: r.width,
          height: r.height,
        }))
      )
    );
    return { formData };
  }

  if (usedPreUpload) {
    formData.set("image_url", payload.uploadedImageUrl!);
    return { formData };
  }

  if (payload.files.length > 0) {
    const preparedArg =
      payload.preparedShareRollScans?.length === payload.files.length
        ? payload.preparedShareRollScans
        : null;
    if (!preparedArg) {
      onProgress?.("Preparing photos…");
    }
    const { rows, failures } = await clientUploadReviewImages(
      filmStockSlug,
      payload.files,
      onProgress,
      preparedArg
    );
    if (rows.length === 0) {
      const detail =
        failures.length > 0
          ? failures.map((f) => `Photo ${f.index + 1}: ${f.message}`).join(" ")
          : "No photos could be uploaded.";
      throw new Error(detail);
    }
    formData.set(
      "client_stored_images",
      JSON.stringify(rows.map((r) => ({ url: r.url, width: r.width, height: r.height })))
    );
    return {
      formData,
      clientUploadFailures: failures.length > 0 ? failures : undefined,
    };
  }

  return { formData };
}

export async function submitNewUserReview(opts: {
  filmStockSlug: string;
  mode: "review" | "upload";
  payload: AddReviewModalPayload;
  onProgress?: (label: string) => void;
  signal?: AbortSignal;
}): Promise<{
  res: Response;
  data: Record<string, unknown>;
  rawText: string;
  clientUploadFailures?: ClientUploadReviewFailure[];
}> {
  const { formData, clientUploadFailures } = await buildUserReviewsFormData({
    filmStockSlug: opts.filmStockSlug,
    mode: opts.mode,
    payload: opts.payload,
    onProgress: opts.onProgress,
  });
  opts.onProgress?.("Saving…");
  const out = await fetchReviewsResponse("/api/user/reviews", "POST", formData, opts.signal);
  return { ...out, clientUploadFailures };
}

/**
 * Full new-review POST with friendly toast messages on failure (upload/encode/network).
 */
export async function postReviewModalSubmission(opts: {
  filmStockSlug: string;
  mode: "review" | "upload";
  payload: AddReviewModalPayload;
  onProgress?: (label: string | null) => void;
  signal?: AbortSignal;
}): Promise<
  | { ok: true; data: Record<string, unknown>; clientUploadFailures?: ClientUploadReviewFailure[] }
  | { ok: false; toast: string }
> {
  try {
    const { res, data, rawText, clientUploadFailures } = await submitNewUserReview({
      filmStockSlug: opts.filmStockSlug,
      mode: opts.mode,
      payload: opts.payload,
      onProgress: (label) => opts.onProgress?.(label),
      signal: opts.signal,
    });
    opts.onProgress?.(null);
    if (!res.ok) {
      return { ok: false, toast: toastMessageForReviewsHttpFailure(res, data, rawText) };
    }
    return {
      ok: true,
      data,
      clientUploadFailures,
    };
  } catch (e) {
    opts.onProgress?.(null);
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, toast: "Request was cancelled or timed out. Try again." };
    }
    const msg = e instanceof Error ? e.message.trim() : "";
    if (msg && /photo\s+\d+:/i.test(msg)) {
      return { ok: false, toast: msg };
    }
    if (
      e instanceof DOMException ||
      /could not be encoded|could not be decoded|invalidstateerror|securityerror/i.test(
        msg.toLowerCase()
      )
    ) {
      return { ok: false, toast: humanizeImagePrepareError(e) };
    }
    return { ok: false, toast: msg || networkErrorToastMessage() };
  }
}

export async function submitUserReviewPatch(opts: {
  reviewId: string;
  filmStockSlug: string;
  payload: AddReviewModalPayload;
  onProgress?: (label: string) => void;
  signal?: AbortSignal;
}): Promise<{
  res: Response;
  data: Record<string, unknown>;
  rawText: string;
  clientUploadFailures?: ClientUploadReviewFailure[];
}> {
  const { formData, clientUploadFailures } = await buildUserReviewsFormData({
    filmStockSlug: opts.filmStockSlug,
    mode: "review",
    payload: opts.payload,
    onProgress: opts.onProgress,
  });
  opts.onProgress?.("Saving…");
  const out = await fetchReviewsResponse(`/api/user/reviews/${opts.reviewId}`, "PATCH", formData, opts.signal);
  return { ...out, clientUploadFailures };
}

export async function patchReviewModalSubmission(opts: {
  reviewId: string;
  filmStockSlug: string;
  payload: AddReviewModalPayload;
  onProgress?: (label: string | null) => void;
  signal?: AbortSignal;
}): Promise<
  | { ok: true; data: Record<string, unknown>; clientUploadFailures?: ClientUploadReviewFailure[] }
  | { ok: false; toast: string }
> {
  try {
    const { res, data, rawText, clientUploadFailures } = await submitUserReviewPatch({
      reviewId: opts.reviewId,
      filmStockSlug: opts.filmStockSlug,
      payload: opts.payload,
      onProgress: (label) => opts.onProgress?.(label),
      signal: opts.signal,
    });
    opts.onProgress?.(null);
    if (!res.ok) {
      return { ok: false, toast: toastMessageForReviewsHttpFailure(res, data, rawText) };
    }
    return { ok: true, data, clientUploadFailures };
  } catch (e) {
    opts.onProgress?.(null);
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, toast: "Request was cancelled or timed out. Try again." };
    }
    const msg = e instanceof Error ? e.message.trim() : "";
    if (msg && /photo\s+\d+:/i.test(msg)) {
      return { ok: false, toast: msg };
    }
    if (
      e instanceof DOMException ||
      /could not be encoded|could not be decoded|invalidstateerror|securityerror/i.test(
        msg.toLowerCase()
      )
    ) {
      return { ok: false, toast: humanizeImagePrepareError(e) };
    }
    return { ok: false, toast: msg || networkErrorToastMessage() };
  }
}
