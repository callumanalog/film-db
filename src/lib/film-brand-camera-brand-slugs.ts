import type { FilmBrand } from "@/lib/types";

/**
 * Default film brand slug → camera brand slug(s) for `/cameras?brand=…`.
 * DB column `film_brands.related_camera_brand_slugs` overrides when non-empty.
 */
const DEFAULT_FILM_BRAND_TO_CAMERA_SLUGS: Record<string, string[]> = {
  kodak: ["kodak-cameras"],
  fujifilm: ["fujifilm-cameras"],
  lomography: ["lomography"],
  rollei: ["rollei"],
  agfa: ["agfa"],
  ilford: [], // no dedicated camera line in seed catalog
  cinestill: [],
  "harman-technology": [],
  harman: [],
};

/** Resolved camera brand slugs for cross-links from a film brand page. */
export function resolveRelatedCameraBrandSlugs(brand: FilmBrand): string[] {
  const fromDb = brand.related_camera_brand_slugs;
  if (Array.isArray(fromDb) && fromDb.length > 0) {
    return [...new Set(fromDb.map((s) => s.trim()).filter(Boolean))];
  }
  return DEFAULT_FILM_BRAND_TO_CAMERA_SLUGS[brand.slug] ?? [];
}

/**
 * Maps each camera-catalog brand slug to its canonical film-brand slug when they are the same entity.
 * Used to merge search results and deep-link to `/brands/{filmSlug}`.
 */
export function buildCameraSlugToFilmSlugMap(filmBrands: FilmBrand[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const b of filmBrands) {
    for (const cam of resolveRelatedCameraBrandSlugs(b)) {
      const key = cam.trim();
      if (!key) continue;
      if (!m.has(key)) m.set(key, b.slug);
    }
  }
  return m;
}
