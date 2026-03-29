import type { FilmUploadRow } from "@/app/actions/uploads";

/** One slide in the mobile film hero community carousel (landscape uploads only). */
export type HeroCarouselSlide = {
  id: string;
  imageUrl: string;
  alt: string;
};

const LANDSCAPE_MIN_RATIO = 1.08;
const MAX_HERO_SLIDES = 12;
const PROBE_BYTE_LENGTH = 131072;

/** Read width/height from the start of a remote image (JPEG/WebP/PNG headers). */
export async function probeRemoteImageDimensions(
  url: string
): Promise<{ width: number; height: number } | null> {
  try {
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${PROBE_BYTE_LENGTH - 1}` },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { default: imageSize } = await import("image-size");
    const dim = imageSize(buf);
    if (!dim.width || !dim.height) return null;
    return { width: dim.width, height: dim.height };
  } catch {
    return null;
  }
}

function isLandscape(w: number, h: number): boolean {
  return w >= h * LANDSCAPE_MIN_RATIO;
}

/**
 * Landscape community uploads for the film detail hero (after stock cover).
 * Uses DB dimensions when present; otherwise probes the image URL once.
 */
export async function buildLandscapeCommunityHeroSlides(
  uploads: FilmUploadRow[],
  stockName: string,
  maxCount: number = MAX_HERO_SLIDES
): Promise<HeroCarouselSlide[]> {
  const withUrl = uploads.filter((u) => u.image_url?.trim());
  const slides: HeroCarouselSlide[] = [];
  const cap = Math.max(0, Math.min(maxCount, MAX_HERO_SLIDES));

  for (const u of withUrl) {
    if (slides.length >= cap) break;
    const url = u.image_url!;
    let w = u.image_width ?? null;
    let h = u.image_height ?? null;
    if (w == null || h == null) {
      const dim = await probeRemoteImageDimensions(url);
      if (!dim) continue;
      w = dim.width;
      h = dim.height;
    }
    if (!isLandscape(w, h)) continue;
    const captionPlain = u.caption?.trim()
      ? u.caption.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "";
    const alt = captionPlain
      ? `${captionPlain} — ${stockName}`
      : `Community photo — ${stockName}`;
    slides.push({ id: u.id, imageUrl: url, alt });
  }

  return slides;
}
