/**
 * Text match quality for ranking search hits (lower is better).
 * 0 = exact, 1 = name starts with query, 2 = name includes query, 3 = weak/no match.
 */
export function matchRank(name: string, query: string): number {
  const n = name.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 3;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return 3;
}

/**
 * Rank for a **film / catalog brand** row. If the user typed past the brand token
 * (e.g. "kodak p", "kodak portra"), treat as no name match so stocks/cameras win.
 */
export function brandCatalogMatchRank(brandName: string, query: string): number {
  const n = brandName.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 3;
  if (q.startsWith(n) && q.length > n.length) return 3;
  return matchRank(n, q);
}
