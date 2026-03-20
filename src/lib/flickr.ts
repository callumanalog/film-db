/**
 * Flickr API integration for sample images (e.g. CineStill 800T).
 * Complies with Flickr API ToS: link to photo, attribution, max 30 per page, API disclaimer.
 * @see https://www.flickr.com/services/api/
 * @see https://www.flickr.com/help/terms/api
 */

const FLICKR_API_BASE = "https://api.flickr.com/services/rest";
const FLICKR_PHOTO_PAGE_BASE = "https://www.flickr.com/photos";
const FLICKR_PROFILE_BASE = "https://www.flickr.com/people";

/** Licenses that allow display with attribution (CC + public domain). Excludes 0 = All Rights Reserved. */
const SAFE_LICENSE_IDS = "1,2,3,4,5,6,7,9,10";

export interface FlickrPhoto {
  id: string;
  /** URL to the image (800px longest edge from url_c). */
  imageUrl: string;
  title: string;
  /** Owner's display name (ownername from API). */
  ownerName: string;
  /** Owner NSID for URLs. */
  ownerNsid: string;
  /** Link to the photo page on Flickr (required by API ToS). */
  flickrPhotoUrl: string;
  /** Link to the photographer's profile. */
  ownerProfileUrl: string;
  license?: string;
  /** Pixel dimensions of url_c when returned by API (for aspect / landscape filter). */
  width?: number;
  height?: number;
}

interface FlickrPhotosSearchResponse {
  stat: string;
  photos?: {
    page: number;
    pages: number;
    perpage: number;
    total: string;
    photo: Array<{
      id: string;
      owner: string;
      secret: string;
      server: string;
      farm?: number;
      title: string;
      url_c?: string;
      ownername?: string;
      license?: string;
      width_c?: number | string;
      height_c?: number | string;
    }>;
  };
}

/**
 * Fetch public photos from Flickr by tag.
 * Uses CC/public-domain license filter when possible. Max 30 per page per API ToS.
 */
export async function fetchFlickrPhotosByTag(
  tag: string,
  options: { perPage?: number; licenseFilter?: boolean } = {}
): Promise<FlickrPhoto[]> {
  const apiKey = process.env.FLICKR_API_KEY;
  if (!apiKey) {
    console.warn("FLICKR_API_KEY is not set; skipping Flickr fetch.");
    return [];
  }

  const perPage = Math.min(options.perPage ?? 20, 30); // API ToS: max 30 per page
  const params = new URLSearchParams({
    method: "flickr.photos.search",
    api_key: apiKey,
    tags: tag,
    tag_mode: "any",
    per_page: String(perPage),
    format: "json",
    nojsoncallback: "1",
    extras: "url_c,owner_name,license,width_c,height_c",
  });

  if (options.licenseFilter !== false) {
    params.set("license", SAFE_LICENSE_IDS);
  }

  const url = `${FLICKR_API_BASE}?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hour
  } catch (e) {
    console.error("Flickr API request failed:", e);
    return [];
  }

  if (!res.ok) {
    console.error("Flickr API error:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as FlickrPhotosSearchResponse;
  if (data.stat !== "ok" || !data.photos?.photo?.length) {
    return [];
  }

  const toNum = (v: number | string | undefined): number | undefined => {
    if (v == null || v === "") return undefined;
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  return data.photos.photo.map((p) => {
    const imageUrl =
      p.url_c ||
      `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_c.jpg`;
    const flickrPhotoUrl = `${FLICKR_PHOTO_PAGE_BASE}/${p.owner}/${p.id}`;
    const ownerProfileUrl = `${FLICKR_PROFILE_BASE}/${p.owner}/`;
    const width = toNum(p.width_c);
    const height = toNum(p.height_c);

    return {
      id: p.id,
      imageUrl,
      title: p.title || "Untitled",
      ownerName: p.ownername || "Flickr User",
      ownerNsid: p.owner,
      flickrPhotoUrl,
      ownerProfileUrl,
      license: p.license,
      width,
      height,
    };
  });
}

/** Keep photos that are clearly wider than tall (for mobile hero carousel). */
export function filterLandscapeFlickrPhotos(
  photos: FlickrPhoto[],
  minWidthOverHeight = 1.08
): FlickrPhoto[] {
  return photos.filter((p) => {
    const { width, height } = p;
    if (width == null || height == null || height < 1) return false;
    return width >= height * minWidthOverHeight;
  });
}

/** Map film stock slug to Flickr search tag(s). */
export const FLICKR_TAG_BY_SLUG: Record<string, string> = {
  "cinestill-800t": "cinestill800t",
};

/**
 * Fetch Flickr sample images for a film stock if it has a known tag.
 * Returns empty array if no API key, no tag mapping, or API error.
 */
export async function getFlickrSampleImagesForStock(
  slug: string
): Promise<FlickrPhoto[]> {
  const tag = FLICKR_TAG_BY_SLUG[slug];
  if (!tag) return [];
  return fetchFlickrPhotosByTag(tag, { perPage: 20 });
}
