/** Long edge cap before WebP/JPEG encode (display-oriented, keeps film scans legible). */
export const SHARE_ROLL_MAX_LONG_EDGE = 2560;
/** WebP quality when supported (~0.82–0.88 per product plan). */
export const SHARE_ROLL_WEBP_QUALITY = 0.85;
/** JPEG fallback quality when WebP is not available. */
export const SHARE_ROLL_JPEG_QUALITY = 0.88;
export const SHARE_ROLL_MAX_DECODE_EDGE = 8192;

let webpEncodeSupported: boolean | null = null;

function detectWebpEncodeSupport(): boolean {
  if (typeof document === "undefined") return false;
  if (webpEncodeSupported !== null) return webpEncodeSupported;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    webpEncodeSupported = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpEncodeSupported = false;
  }
  return webpEncodeSupported;
}

export type PreparedShareRollImage = {
  blob: Blob;
  width: number;
  height: number;
  contentType: string;
  fileExtension: string;
};

/**
 * Decode, optionally downscale, and re-encode as WebP (or JPEG fallback) for upload.
 */
export async function prepareShareRollImageFile(file: File): Promise<PreparedShareRollImage> {
  const bitmap = await createImageBitmap(file);
  try {
    let w = bitmap.width;
    let h = bitmap.height;
    if (w < 1 || h < 1) {
      throw new Error("Invalid image dimensions");
    }
    if (w > SHARE_ROLL_MAX_DECODE_EDGE || h > SHARE_ROLL_MAX_DECODE_EDGE) {
      throw new Error(`Image too large (max ${SHARE_ROLL_MAX_DECODE_EDGE}px per side).`);
    }
    const maxEdge = SHARE_ROLL_MAX_LONG_EDGE;
    if (w > maxEdge || h > maxEdge) {
      const scale = maxEdge / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image");
    ctx.drawImage(bitmap, 0, 0, w, h);

    const useWebp = detectWebpEncodeSupport();
    const mime = useWebp ? "image/webp" : "image/jpeg";
    const quality = useWebp ? SHARE_ROLL_WEBP_QUALITY : SHARE_ROLL_JPEG_QUALITY;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, quality);
    });
    if (!blob || blob.size < 1) {
      throw new Error(
        "Browser returned an empty file after compressing the image (WebP/JPEG export produced no data)."
      );
    }

    return {
      blob,
      width: w,
      height: h,
      contentType: mime,
      fileExtension: useWebp ? "webp" : "jpg",
    };
  } finally {
    bitmap.close();
  }
}

/**
 * Quick decode check for picker validation (no re-encode).
 */
export async function assertFileDecodesAsImage(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    if (w > SHARE_ROLL_MAX_DECODE_EDGE || h > SHARE_ROLL_MAX_DECODE_EDGE) {
      throw new Error(`Image too large (max ${SHARE_ROLL_MAX_DECODE_EDGE}px per side).`);
    }
    return { width: w, height: h };
  } finally {
    bitmap.close();
  }
}
