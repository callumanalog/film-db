import type { FilmUploadRow } from "@/app/actions/uploads";
import type { FlickrPhoto } from "@/lib/flickr";
import type { GalleryImage } from "@/lib/sample-images";
import type { ImageLightboxData } from "@/components/image-lightbox";
import { plainTextFromPossibleHtml } from "@/lib/sanitize-review-like-html";

export function isSameLightboxSlide(a: ImageLightboxData, b: ImageLightboxData): boolean {
  const aId = a.uploadId?.trim();
  const bId = b.uploadId?.trim();
  if (aId && bId) return aId === bId;
  return a.imageUrl === b.imageUrl;
}

/** Other community gallery images on the same film stock (Discover / Community page grid). */
export function relatedGalleryLightboxSlidesForStock(
  current: ImageLightboxData,
  galleryImages: GalleryImage[]
): ImageLightboxData[] {
  const href = current.context?.href;
  if (!href?.startsWith("/films/")) return [];
  const slug = href.slice("/films/".length).split(/[/?#]/)[0];
  if (!slug) return [];
  const out: ImageLightboxData[] = [];
  for (const img of galleryImages) {
    if (img.stockSlug !== slug) continue;
    const s = galleryImageToLightbox(img);
    if (!s || isSameLightboxSlide(current, s)) continue;
    out.push(s);
  }
  return out;
}

export function findGalleryImageForLightboxSlide(
  slide: ImageLightboxData,
  images: GalleryImage[]
): GalleryImage | undefined {
  return images.find((i) => {
    const su = slide.uploadId?.trim();
    const iu = i.uploadId?.trim();
    if (su && iu) return su === iu;
    return i.imageUrl === slide.imageUrl;
  });
}

/** Other uploads + Flickr shots on the same film stock page (excludes `current`). */
export function relatedFilmPageLightboxSlides(
  current: ImageLightboxData,
  uploads: FilmUploadRow[],
  flickrPhotos: FlickrPhoto[],
  stockName: string,
  slug: string
): ImageLightboxData[] {
  const out: ImageLightboxData[] = [];
  for (const u of uploads) {
    const s = filmUploadToLightboxData(u, stockName, slug);
    if (!s || isSameLightboxSlide(current, s)) continue;
    out.push(s);
  }
  for (const f of flickrPhotos) {
    const s: ImageLightboxData = {
      imageUrl: f.imageUrl,
      alt: f.title || `${stockName} on Flickr`,
      caption: f.title?.trim() || null,
      username: f.ownerName,
      context: { label: stockName, href: `/films/${slug}` },
    };
    if (isSameLightboxSlide(current, s)) continue;
    out.push(s);
  }
  return out;
}

export function galleryImageToLightbox(img: GalleryImage): ImageLightboxData | undefined {
  if (!img.imageUrl) return undefined;
  const altFromCaption = img.caption?.trim()
    ? plainTextFromPossibleHtml(img.caption).slice(0, 240)
    : "";
  return {
    imageUrl: img.imageUrl,
    uploadId: img.uploadId?.trim() || null,
    userId: img.userId?.trim() || null,
    alt: altFromCaption || `${img.stockName} · ${img.username}`,
    caption: img.caption,
    username: img.username,
    likeCount: img.likes ?? null,
    context: { label: img.stockName, href: `/films/${img.stockSlug}` },
    metadata: {
      camera: img.camera || null,
      shot_iso: img.shot_iso ?? null,
      lens: img.lens ?? null,
      lab: img.lab ?? null,
      filter: img.filter ?? null,
      scanner: img.scanner ?? null,
      push_pull: img.push_pull ?? null,
    },
  };
}

function metadataFromUpload(u: FilmUploadRow) {
  return {
    camera: u.camera ?? null,
    shot_iso: u.shot_iso ?? null,
    lens: u.lens ?? null,
    lab: u.lab ?? null,
    filter: u.filter ?? null,
    scanner: u.scanner ?? null,
    push_pull: u.push_pull ?? null,
  };
}

/** One community row → lightbox slide (film stock context). */
export function filmUploadToLightboxData(
  u: FilmUploadRow,
  stockName: string,
  slug: string
): ImageLightboxData | null {
  if (!u.image_url?.trim()) return null;
  const altFromCaption = u.caption?.trim()
    ? plainTextFromPossibleHtml(u.caption).slice(0, 240)
    : "";
  return {
    imageUrl: u.image_url,
    uploadId: u.id,
    userId: u.user_id?.trim() || null,
    alt: altFromCaption || `${stockName} · ${u.display_name ?? "Member"}`,
    caption: u.caption,
    username: u.display_name?.trim() || "Member",
    location: u.location?.trim() || null,
    createdAt: u.created_at ?? null,
    likeCount: u.like_count ?? null,
    context: { label: stockName, href: `/films/${slug}` },
    metadata: metadataFromUpload(u),
  };
}

export function uploadGroupKey(u: Pick<FilmUploadRow, "id" | "review_id" | "upload_batch_id">): string {
  if (u.review_id?.trim()) return `review:${u.review_id}`;
  if (u.upload_batch_id?.trim()) return `batch:${u.upload_batch_id}`;
  return `solo:${u.id}`;
}

export function galleryImageGroupKey(img: GalleryImage): string {
  if (img.reviewId?.trim()) return `review:${img.reviewId}`;
  if (img.uploadBatchId?.trim()) return `batch:${img.uploadBatchId}`;
  return `solo:${img.galleryId}`;
}

export function collectLightboxSlidesFromFilmUploads(
  all: FilmUploadRow[],
  clicked: FilmUploadRow,
  stockName: string,
  slug: string
): { slides: ImageLightboxData[]; initialIndex: number } {
  const key = uploadGroupKey(clicked);
  const siblings = all.filter((u) => uploadGroupKey(u) === key);
  const slides = siblings
    .map((u) => filmUploadToLightboxData(u, stockName, slug))
    .filter((s): s is ImageLightboxData => s != null);
  const initialIndex = Math.max(
    0,
    siblings.findIndex((u) => u.id === clicked.id)
  );
  return { slides, initialIndex };
}

export function collectLightboxSlidesFromGalleryImages(
  all: GalleryImage[],
  clicked: GalleryImage
): { slides: ImageLightboxData[]; initialIndex: number } {
  const key = galleryImageGroupKey(clicked);
  const siblings = all.filter((i) => galleryImageGroupKey(i) === key);
  const slides = siblings
    .map((i) => galleryImageToLightbox(i))
    .filter((s): s is ImageLightboxData => s != null);
  const initialIndex = Math.max(
    0,
    siblings.findIndex((i) => i.galleryId === clicked.galleryId)
  );
  return { slides, initialIndex };
}
