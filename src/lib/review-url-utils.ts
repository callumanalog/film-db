/**
 * Pure URL → review shape helpers (no Node deps). Safe to import from client components.
 */

export function urlToWebReview(url: string): { title: string; site: string; url: string } {
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

export function urlToVideoReview(url: string): { title: string; channel: string; url: string } {
  const u = url.trim();
  return { title: "Video review", channel: "YouTube", url: u };
}
