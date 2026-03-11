/**
 * Editable film reviews: when data/film-reviews.json exists, per-slug reviews are read from it.
 * Shape: Record<slug, { web: { title, site, url }[], video: { title, channel, url }[] }>
 */

export type WebReview = { title: string; site: string; url: string };
export type VideoReview = { title: string; channel: string; url: string };

export type FilmReviewsEntry = { web: WebReview[]; video: VideoReview[] };
export type FilmReviewsBySlug = Record<string, FilmReviewsEntry>;

const REVIEWS_PATH = "data/film-reviews.json";

function getDataPath(): string | null {
  if (typeof process === "undefined" || !process.cwd) return null;
  try {
    const path = require("path");
    return path.join(process.cwd(), REVIEWS_PATH);
  } catch {
    return null;
  }
}

export function getFilmReviewsFromFile(): FilmReviewsBySlug | null {
  const fullPath = getDataPath();
  if (!fullPath) return null;
  try {
    const fs = require("fs");
    if (!fs.existsSync(fullPath)) return null;
    const raw = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw) as unknown;
    if (data === null || typeof data !== "object" || Array.isArray(data)) return null;
    return data as FilmReviewsBySlug;
  } catch {
    return null;
  }
}

export function writeFilmReviewsToFile(reviews: FilmReviewsBySlug): void {
  const fullPath = getDataPath();
  if (!fullPath) throw new Error("Cannot resolve data path");
  const fs = require("fs");
  const path = require("path");
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(reviews, null, 2), "utf-8");
}

/** Convert a web URL to WebReview (title/site derived from URL). */
export function urlToWebReview(url: string): WebReview {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    const site = host.split(".").slice(-2).join(".");
    const title = `${site} review`;
    return { title, site: host, url: url.trim() };
  } catch {
    return { title: "Web review", site: "Web", url: url.trim() };
  }
}

/** Convert a YouTube (or video) URL to VideoReview. */
export function urlToVideoReview(url: string): VideoReview {
  const u = url.trim();
  return { title: "Video review", channel: "YouTube", url: u };
}
