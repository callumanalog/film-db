export type ClientStoredImageInput = {
  url: string;
  width?: unknown;
  height?: unknown;
};

export type ValidatedStoredRow = {
  url: string;
  image_width: number | null;
  image_height: number | null;
};

/**
 * Ensures public URLs point at this project's user-uploads object for the given user + film slug.
 */
export function validateClientStoredImageRows(
  supabaseUrl: string,
  userId: string,
  filmSlug: string,
  items: ClientStoredImageInput[],
  maxFiles: number
): { ok: true; rows: ValidatedStoredRow[] } | { ok: false; message: string } {
  if (!supabaseUrl?.trim()) {
    return { ok: false, message: "Server misconfiguration (Supabase URL)." };
  }
  if (!items.length) {
    return { ok: false, message: "No stored images provided." };
  }
  if (items.length > maxFiles) {
    return { ok: false, message: `Too many images (max ${maxFiles}).` };
  }

  let baseOrigin: string;
  try {
    baseOrigin = new URL(supabaseUrl.trim()).origin;
  } catch {
    return { ok: false, message: "Invalid Supabase URL." };
  }

  const slugEnc = encodeURIComponent(filmSlug);
  const prefixes = [
    `/storage/v1/object/public/user-uploads/${userId}/${filmSlug}/`,
    `/storage/v1/object/public/user-uploads/${userId}/${slugEnc}/`,
  ];

  const rows: ValidatedStoredRow[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item || typeof item.url !== "string") {
      return { ok: false, message: "Invalid stored image entry." };
    }
    const trimmed = item.url.trim();
    if (!trimmed.startsWith("https://")) {
      return { ok: false, message: "Invalid image URL." };
    }
    let u: URL;
    try {
      u = new URL(trimmed);
    } catch {
      return { ok: false, message: "Invalid image URL." };
    }
    if (u.origin !== baseOrigin) {
      return { ok: false, message: "Image URL does not match this app." };
    }
    const path = u.pathname;
    if (!prefixes.some((p) => path.startsWith(p))) {
      return { ok: false, message: "Image path is not allowed for this roll." };
    }
    if (seen.has(trimmed)) {
      return { ok: false, message: "Duplicate image URL." };
    }
    seen.add(trimmed);

    const w =
      typeof item.width === "number" && Number.isFinite(item.width) && item.width > 0
        ? Math.round(item.width)
        : null;
    const h =
      typeof item.height === "number" && Number.isFinite(item.height) && item.height > 0
        ? Math.round(item.height)
        : null;

    rows.push({ url: trimmed, image_width: w, image_height: h });
  }

  return { ok: true, rows };
}
