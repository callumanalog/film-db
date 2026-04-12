/** Normalize DB / JSON / props values for brand header (year + country). */

export function parseFoundedYear(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

export function parseCountry(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}
