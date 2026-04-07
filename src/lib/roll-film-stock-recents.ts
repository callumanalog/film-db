/**
 * MRU film stocks (slugs) for the share-a-roll stock picker; per-user localStorage.
 */

import { getRollPickerMru, recordRollPickerMru } from "@/lib/roll-picker-mru";

export function getRollFilmStockRecents(userId: string | null, limit = 3): string[] {
  return getRollPickerMru(userId, "film_stock", limit);
}

export function recordRollFilmStockRecent(userId: string | null, filmStockSlug: string): void {
  recordRollPickerMru(userId, "film_stock", filmStockSlug);
}
