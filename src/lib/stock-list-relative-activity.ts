const EDIT_THRESHOLD_MS = 1000;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole calendar months elapsed from `from` to `to` (both instants; day-of-month aware). */
function wholeMonthsBetween(from: Date, to: Date): number {
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) m -= 1;
  return Math.max(0, m);
}

/** Calendar days from `from`’s local date to `to`’s local date (non-negative). */
function calendarDayDiffFrom(from: Date, to: Date): number {
  const a = startOfLocalDay(from).getTime();
  const b = startOfLocalDay(to).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * "Created …" / "Updated …" copy for list detail. Uses local calendar days for 0–30,
 * then months (1–11), then years. Anchor is `updated_at` when it differs from `created_at`.
 */
export function formatStockListActivityPhrase(
  createdAtIso: string,
  updatedAtIso: string,
  now: Date = new Date()
): string {
  const created = new Date(createdAtIso);
  const updated = new Date(updatedAtIso);
  if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
    return "Created recently";
  }

  const edited = updated.getTime() - created.getTime() > EDIT_THRESHOLD_MS;
  const reference = edited ? updated : created;
  const prefix = edited ? "Updated" : "Created";

  if (reference.getTime() > now.getTime()) {
    return `${prefix} today`;
  }

  const dayDiff = calendarDayDiffFrom(reference, now);

  if (dayDiff === 0) return `${prefix} today`;
  if (dayDiff === 1) return `${prefix} yesterday`;
  if (dayDiff >= 2 && dayDiff <= 30) {
    return `${prefix} ${dayDiff} days ago`;
  }

  const months = wholeMonthsBetween(reference, now);

  if (months < 12) {
    if (months <= 0) {
      return `${prefix} ${dayDiff} days ago`;
    }
    if (months === 1) return `${prefix} a month ago`;
    return `${prefix} ${months} months ago`;
  }

  const years = Math.floor(months / 12);
  const y = Math.max(1, years);
  return `${prefix} ${y} year${y === 1 ? "" : "s"} ago`;
}
