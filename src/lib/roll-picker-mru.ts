/**
 * MRU stacks (max 3) for share-roll pickers. Per-user localStorage.
 * Camera keeps legacy key `film-db-roll-camera-recents:`; location/lens/lab use `*-mru:` keys.
 */

export type RollPickerMruKind =
  | "camera"
  | "film_stock"
  | "location"
  | "lens"
  | "lab"
  | "scanner";

const PREFIX: Record<RollPickerMruKind, string> = {
  camera: "film-db-roll-camera-recents:",
  film_stock: "film-db-roll-film-stock-mru:",
  location: "film-db-roll-location-mru:",
  lens: "film-db-roll-lens-mru:",
  lab: "film-db-roll-lab-mru:",
  scanner: "film-db-roll-scanner-mru:",
};

const DEFAULT_MAX = 3;

function storageKey(userId: string | null, kind: RollPickerMruKind): string {
  return `${PREFIX[kind]}${userId?.trim() || "anon"}`;
}

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const o = JSON.parse(raw) as unknown;
    if (!Array.isArray(o)) return [];
    return o
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function getRollPickerMru(
  userId: string | null,
  kind: RollPickerMruKind,
  limit = DEFAULT_MAX
): string[] {
  if (typeof window === "undefined") return [];
  return parseList(localStorage.getItem(storageKey(userId, kind))).slice(0, limit);
}

export function recordRollPickerMru(
  userId: string | null,
  kind: RollPickerMruKind,
  value: string
): void {
  const t = value.trim();
  if (!t || typeof window === "undefined") return;
  const key = storageKey(userId, kind);
  const cur = parseList(localStorage.getItem(key));
  const next = [t, ...cur.filter((x) => x !== t)].slice(0, DEFAULT_MAX);
  localStorage.setItem(key, JSON.stringify(next));
}
