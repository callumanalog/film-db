/**
 * Single user for now. When adding auth/Supabase, replace with current user id from session.
 */
export const CURRENT_USER_ID = "user-alex";

const STORAGE_KEY_PREFIX = "film-db-user-";

export interface TrackedEntry {
  slug: string;
  format: string;
  status: string;
  expiryDate: string;
  notes: string;
}

export interface StoredUserProfile {
  shotSlugs: string[];
  favouriteSlugs: string[];
  tracked: TrackedEntry[];
  /** slug -> 1-5 rating */
  ratings: Record<string, number>;
}

const DEFAULT_PROFILE: StoredUserProfile = {
  shotSlugs: [],
  favouriteSlugs: [],
  tracked: [],
  ratings: {},
};

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function getStoredProfile(userId: string): StoredUserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<StoredUserProfile>;
    return {
      shotSlugs: Array.isArray(parsed.shotSlugs) ? parsed.shotSlugs : DEFAULT_PROFILE.shotSlugs,
      favouriteSlugs: Array.isArray(parsed.favouriteSlugs) ? parsed.favouriteSlugs : DEFAULT_PROFILE.favouriteSlugs,
      tracked: Array.isArray(parsed.tracked) ? parsed.tracked : DEFAULT_PROFILE.tracked,
      ratings: parsed.ratings && typeof parsed.ratings === "object" ? parsed.ratings : DEFAULT_PROFILE.ratings,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function setStoredProfile(userId: string, profile: StoredUserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function toggleShot(userId: string, slug: string): { added: boolean } {
  const profile = getStoredProfile(userId);
  const has = profile.shotSlugs.includes(slug);
  if (has) {
    profile.shotSlugs = profile.shotSlugs.filter((s) => s !== slug);
    setStoredProfile(userId, profile);
    return { added: false };
  }
  profile.shotSlugs = [...profile.shotSlugs, slug];
  setStoredProfile(userId, profile);
  return { added: true };
}

export function toggleFavourite(userId: string, slug: string): { added: boolean } {
  const profile = getStoredProfile(userId);
  const has = profile.favouriteSlugs.includes(slug);
  if (has) {
    profile.favouriteSlugs = profile.favouriteSlugs.filter((s) => s !== slug);
    setStoredProfile(userId, profile);
    return { added: false };
  }
  profile.favouriteSlugs = [...profile.favouriteSlugs, slug];
  setStoredProfile(userId, profile);
  return { added: true };
}

/** Add or update tracked entry for this slug (one entry per slug). */
export function addOrUpdateTracked(userId: string, entry: TrackedEntry): void {
  const profile = getStoredProfile(userId);
  const idx = profile.tracked.findIndex((t) => t.slug === entry.slug);
  if (idx >= 0) {
    profile.tracked[idx] = entry;
  } else {
    profile.tracked.push(entry);
  }
  setStoredProfile(userId, profile);
}

export function removeTracked(userId: string, slug: string): void {
  const profile = getStoredProfile(userId);
  profile.tracked = profile.tracked.filter((t) => t.slug !== slug);
  setStoredProfile(userId, profile);
}

export function setRating(userId: string, slug: string, rating: number): void {
  const profile = getStoredProfile(userId);
  if (rating <= 0) {
    const { [slug]: _, ...rest } = profile.ratings;
    profile.ratings = rest;
  } else {
    profile.ratings = { ...profile.ratings, [slug]: rating };
  }
  setStoredProfile(userId, profile);
}
