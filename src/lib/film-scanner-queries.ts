import { seedFilmScanners, type FilmScannerSeedRow } from "@/lib/film-scanner-seed-data";

/** Pinned picker option; stored verbatim in `user_uploads.scanner`. */
export const FILM_SCANNER_CAMERA_SCANNING_DISPLAY = "Camera scanning";

/** Row label (same as storage for this option). */
export const FILM_SCANNER_CAMERA_SCANNING_ROW_LABEL = "Camera scanning";

/** Section header (short), mirrors “Home dev” on labs. */
export const FILM_SCANNER_CAMERA_SECTION_HEADER = "Camera scan";

/** Search: show pinned block when query is empty or prefixes this (e.g. c, ca, camera, camera s…). */
export const FILM_SCANNER_CAMERA_SEARCH_PREFIX = "camera scan";

export type FilmScannerWithDisplay = FilmScannerSeedRow & { displayName: string };

export interface FilmScannerFilters {
  search?: string;
}

export async function getFilmScanners(filters?: FilmScannerFilters): Promise<FilmScannerWithDisplay[]> {
  let rows: FilmScannerWithDisplay[] = seedFilmScanners.map((r) => ({
    ...r,
    displayName: r.name.trim(),
  }));

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
  );

  return rows;
}
