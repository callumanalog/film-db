/**
 * Short, action-oriented lines for share-a-roll scan tiles. The UI shows “Couldn’t add this scan”
 * and the file name above; these strings are the subtext only.
 */

export const SCAN_TILE_MSG_TRY_AGAIN = "Please try again.";
export const SCAN_TILE_MSG_TOO_LARGE = "This image is too large. Please try again.";
export const SCAN_TILE_MSG_WRONG_TYPE = "Use JPG, PNG, or WebP.";
export const SCAN_TILE_MSG_SIGN_IN = "Please sign in and try again.";

/** Map decode (createImageBitmap / assert) failures to tile subtext. */
export function humanizeImageDecodeError(error: unknown, _fileName?: string): string {
  if (error instanceof DOMException) {
    const m = (error.message || "").toLowerCase();
    if (m.includes("could not be decoded") || m.includes("decode")) {
      return SCAN_TILE_MSG_TRY_AGAIN;
    }
    if (m.includes("invalid state") || m.includes("security")) {
      return SCAN_TILE_MSG_TRY_AGAIN;
    }
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg.includes("Image too large") || (msg.includes("max ") && msg.includes("px"))) {
      return SCAN_TILE_MSG_TOO_LARGE;
    }
    if (msg) return SCAN_TILE_MSG_TRY_AGAIN;
  }
  return SCAN_TILE_MSG_TRY_AGAIN;
}

/** Map prepareShareRollImageFile failures to tile subtext. */
export function humanizeImagePrepareError(error: unknown, _fileName?: string): string {
  if (error instanceof DOMException) {
    const m = (error.message || "").toLowerCase();
    if (
      m.includes("source image could not be encoded") ||
      m.includes("could not be encoded") ||
      m.includes("encoding")
    ) {
      return SCAN_TILE_MSG_TRY_AGAIN;
    }
    if (m.includes("could not be decoded")) {
      return humanizeImageDecodeError(error, _fileName);
    }
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg === SCAN_TILE_MSG_SIGN_IN) return SCAN_TILE_MSG_SIGN_IN;
    if (msg.includes("Image too large") || (msg.includes("max ") && msg.includes("px"))) {
      return SCAN_TILE_MSG_TOO_LARGE;
    }
    if (msg.includes("Invalid image dimensions")) {
      return SCAN_TILE_MSG_TRY_AGAIN;
    }
    if (msg.includes("Could not prepare image")) {
      return SCAN_TILE_MSG_TRY_AGAIN;
    }
    if (msg.includes("Could not encode image") || msg.includes("empty")) {
      return SCAN_TILE_MSG_TRY_AGAIN;
    }
    if (msg) return SCAN_TILE_MSG_TRY_AGAIN;
  }
  return SCAN_TILE_MSG_TRY_AGAIN;
}

export function humanizeStorageUploadError(message: string, _imageIndexOneBased: number): string {
  const raw = message.trim() || "Unknown storage error";
  const lower = raw.toLowerCase();
  if (/size|limit|large|too big|413|exceeds|maximum/i.test(raw)) {
    return SCAN_TILE_MSG_TRY_AGAIN;
  }
  if (/mime|type|not allowed|invalid.*type/i.test(raw)) {
    return SCAN_TILE_MSG_WRONG_TYPE;
  }
  if (/policy|row-level|rls|permission|denied|unauthorized/i.test(lower)) {
    return SCAN_TILE_MSG_SIGN_IN;
  }
  return SCAN_TILE_MSG_TRY_AGAIN;
}
