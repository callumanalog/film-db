/** Accept `YYYY-MM-DD` from `<input type="date">` for Postgres `DATE`; otherwise null. */
export function shotDateForUserUploadDb(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const [y, m, d] = t.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return t;
}
