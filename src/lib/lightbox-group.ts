import type { FilmUploadRow } from "@/app/actions/uploads";
import type { GalleryImage } from "@/lib/sample-images";
import type { ImageLightboxData } from "@/components/image-lightbox";
import { plainTextFromPossibleHtml } from "@/lib/sanitize-review-like-html";

export function galleryImageToLightbox(img: GalleryImage): ImageLightboxData | undefined {
  if (!img.imageUrl) return undefined;
  const altFromCaption = img.caption?.trim()
    ? plainTextFromPossibleHtml(img.caption).slice(0, 240)
    : "";
  return {
    imageUrl: img.imageUrl,
    alt: altFromCaption || `${img.stockName} · ${img.username}`,
    caption: img.caption,
    username: img.username,
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
    alt: altFromCaption || `${stockName} · ${u.display_name ?? "Member"}`,
    caption: u.caption,
    username: u.display_name?.trim() || "Member",
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
