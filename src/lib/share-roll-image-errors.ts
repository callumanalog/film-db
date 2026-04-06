/**
 * User-facing explanations for browser image decode / canvas encode failures.
 * Browsers often throw opaque DOMException text (e.g. "The source image could not be encoded").
 */

function trimFileLabel(name: string | undefined, max = 36): string {
  if (!name?.trim()) return "this file";
  const t = name.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Map decode (createImageBitmap / assert) failures to a clear line. */
export function humanizeImageDecodeError(error: unknown, fileName?: string): string {
  const label = trimFileLabel(fileName);
  if (error instanceof DOMException) {
    const m = (error.message || "").toLowerCase();
    if (m.includes("could not be decoded") || m.includes("decode")) {
      return `Could not read ${label} as an image. The file may be corrupted, truncated, or not a real image. Try re-exporting as JPEG or PNG.`;
    }
    if (m.includes("invalid state") || m.includes("security")) {
      return `The browser blocked reading ${label}. Try a different photo or save a copy in your Photos app first.`;
    }
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg.includes("Image too large") || (msg.includes("max ") && msg.includes("px"))) {
      return msg;
    }
    if (msg) return `${msg} (${label})`;
  }
  return `Could not open ${label} as an image. Try another file (JPEG or PNG).`;
}

/** Map prepareShareRollImageFile failures to a clear line. */
export function humanizeImagePrepareError(error: unknown, fileName?: string): string {
  const label = trimFileLabel(fileName);
  if (error instanceof DOMException) {
    const m = (error.message || "").toLowerCase();
    if (
      m.includes("source image could not be encoded") ||
      m.includes("could not be encoded") ||
      m.includes("encoding")
    ) {
      return `Could not compress ${label} for upload: the browser failed to export it (often wide-gamut HEIC, unusual color profiles, or a Safari/WebKit bug). Re-export as a standard sRGB JPEG or PNG and try again.`;
    }
    if (m.includes("could not be decoded")) {
      return humanizeImageDecodeError(error, fileName);
    }
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg.includes("Image too large") || (msg.includes("max ") && msg.includes("px"))) {
      return msg;
    }
    if (msg.includes("Invalid image dimensions")) {
      return `Image dimensions are invalid for ${label}. Try another file.`;
    }
    if (msg.includes("Could not prepare image")) {
      return `Could not draw ${label} in the browser (canvas unavailable). Try closing other tabs or another photo.`;
    }
    if (msg.includes("Could not encode image") || msg.includes("empty")) {
      return `Compression produced no output for ${label}. Try a smaller JPEG/PNG or re-export from Photos / Lightroom.`;
    }
    if (msg) return `${msg} (${label})`;
  }
  return `Could not process ${label} for upload. Try a standard JPEG or PNG export.`;
}

export function humanizeStorageUploadError(message: string, fileIndexOneBased: number): string {
  const raw = message.trim() || "Unknown storage error";
  const lower = raw.toLowerCase();
  if (/size|limit|large|too big|413|exceeds|maximum/i.test(raw)) {
    return `Photo ${fileIndexOneBased} is too large for storage (${raw}). Try a smaller export.`;
  }
  if (/mime|type|not allowed|invalid.*type/i.test(raw)) {
    return `Photo ${fileIndexOneBased}: storage rejected the file type. Use JPEG, PNG, or WebP.`;
  }
  if (/policy|row-level|rls|permission|denied|unauthorized/i.test(lower)) {
    return `Photo ${fileIndexOneBased}: upload was blocked by permissions. Sign in again or contact support.`;
  }
  return `Photo ${fileIndexOneBased} failed to upload: ${raw}`;
}
