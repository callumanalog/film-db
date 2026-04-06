import { seedFilmLabs, type FilmLabSeedRow } from "@/lib/film-lab-seed-data";

/** Pinned picker option; stored verbatim in `user_uploads.lab`. */
export const FILM_LAB_HOME_DEVELOPMENT_DISPLAY = "Home development / Self-processed";

/** Shorter label in the lab picker row (storage still uses `FILM_LAB_HOME_DEVELOPMENT_DISPLAY`). */
export const FILM_LAB_HOME_DEVELOPMENT_ROW_LABEL = "Home development";

/** Normalized prefix for search: show Home dev section when query is empty or prefixes this. */
export const FILM_LAB_HOME_DEV_SEARCH_PREFIX = "home dev";

export type FilmLabWithDisplay = FilmLabSeedRow & { displayName: string };

export function filmLabDisplayName(row: FilmLabSeedRow): string {
  const n = row.name.trim();
  const c = row.country.trim();
  return `${n}, ${c}`;
}

/** Maps stored `user_uploads.lab` (catalog `displayName`) → short name for UI outside the picker. */
const filmLabStoredToPublicName: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const row of seedFilmLabs) {
    m.set(filmLabDisplayName(row), row.name.trim());
  }
  return m;
})();

/**
 * Lab label for metadata rows, feed chips, lightbox, etc. Country stays in the stored value
 * and in the picker list only.
 */
export function filmLabPublicLabel(stored: string | null | undefined): string {
  const t = (stored ?? "").trim();
  if (!t) return "";
  if (t === FILM_LAB_HOME_DEVELOPMENT_DISPLAY) return t;
  return filmLabStoredToPublicName.get(t) ?? t;
}

export interface FilmLabFilters {
  search?: string;
}

export async function getFilmLabs(filters?: FilmLabFilters): Promise<FilmLabWithDisplay[]> {
  let rows: FilmLabWithDisplay[] = seedFilmLabs.map((r) => ({
    ...r,
    displayName: filmLabDisplayName(r),
  }));

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
  );

  return rows;
}
