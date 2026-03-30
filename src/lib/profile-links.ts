/** Normalize Instagram field: @handle, handle, or instagram.com URL → canonical https URL, or null if empty/invalid. */
export function normalizeInstagramInput(raw: string): { ok: true; url: string | null } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: true, url: null };

  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      const host = u.hostname.replace(/^www\./i, "");
      if (host !== "instagram.com") {
        return { ok: false, error: "Enter a valid Instagram profile link." };
      }
      const seg = u.pathname.split("/").filter(Boolean)[0];
      if (!seg || !/^[a-zA-Z0-9._]+$/.test(seg)) {
        return { ok: false, error: "Enter a valid Instagram username or link." };
      }
      return { ok: true, url: `https://www.instagram.com/${seg}/` };
    } catch {
      return { ok: false, error: "Enter a valid Instagram link." };
    }
  }

  const handle = t.replace(/^@+/, "").split("/")[0].split("?")[0].trim();
  if (!handle) return { ok: true, url: null };
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
    return { ok: false, error: "Instagram username looks invalid." };
  }
  return { ok: true, url: `https://www.instagram.com/${handle}/` };
}

/** Normalize website: add https if missing; return null if empty. */
export function normalizeWebsiteInput(raw: string): { ok: true; url: string | null } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: true, url: null };

  let s = t;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!u.hostname || u.hostname.length < 1) {
      return { ok: false, error: "Enter a valid website URL." };
    }
    if (u.hostname === "localhost" || u.hostname.includes(".")) {
      return { ok: true, url: u.toString() };
    }
    return { ok: false, error: "Enter a valid website URL." };
  } catch {
    return { ok: false, error: "Enter a valid website URL." };
  }
}

/** For settings form: show @handle when we have a stored instagram URL. */
export function instagramUrlToFormValue(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const m = url.trim().match(/instagram\.com\/([^/?#]+)/i);
  return m ? `@${m[1]}` : url.trim();
}
