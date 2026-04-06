import type { HomeFeedGroup } from "@/app/actions/home-feed";
import type { FilmUploadRow } from "@/app/actions/uploads";
import type { GalleryImage } from "@/lib/sample-images";
import { filmLabPublicLabel } from "@/lib/film-lab-queries";

export type RollMetadataUpdatedDetail = {
  reviewId: string;
  /** When set, also keys the session patch so slides with only `upload_batch_id` still match. */
  uploadBatchId?: string | null;
  reviewTitle: string | null;
  caption: string | null;
  camera: string | null;
  shot_iso: string | null;
  lens: string | null;
  lab: string | null;
  scanner: string | null;
  format: string | null;
  location: string | null;
  shot_date: string | null;
  tags: string | null;
};

export const ROLL_METADATA_UPDATED_EVENT = "roll-metadata-updated";

const patchByReviewId = new Map<string, RollMetadataUpdatedDetail>();
const patchByUploadBatchId = new Map<string, RollMetadataUpdatedDetail>();

/**
 * Latest successful “Save roll” snapshot per review (and optional batch), for UI that still
 * holds stale slide props (profile, or feed rows keyed only by upload_batch_id).
 */
export function getRollMetadataPatchForRoll(
  reviewId: string | null | undefined,
  uploadBatchId: string | null | undefined
): RollMetadataUpdatedDetail | undefined {
  const rid = reviewId?.trim();
  if (rid && patchByReviewId.has(rid)) return patchByReviewId.get(rid);
  const bid = uploadBatchId?.trim();
  if (bid && patchByUploadBatchId.has(bid)) return patchByUploadBatchId.get(bid);
  return undefined;
}

export function dispatchRollMetadataUpdated(detail: RollMetadataUpdatedDetail): void {
  const rid = detail.reviewId.trim();
  if (rid) patchByReviewId.set(rid, detail);
  const bid = detail.uploadBatchId?.trim();
  if (bid) patchByUploadBatchId.set(bid, detail);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ROLL_METADATA_UPDATED_EVENT, { detail }));
  }
}

function rowMatchesRollPatch(
  u: { review_id?: string | null; upload_batch_id?: string | null },
  detail: RollMetadataUpdatedDetail
): boolean {
  const rid = detail.reviewId.trim();
  const batch = detail.uploadBatchId?.trim();
  if (rid && (u.review_id?.trim() ?? "") === rid) return true;
  if (batch && (u.upload_batch_id?.trim() ?? "") === batch) return true;
  return false;
}

export function patchHomeFeedGroups(
  groups: HomeFeedGroup[],
  detail: RollMetadataUpdatedDetail
): HomeFeedGroup[] {
  if (!detail.reviewId.trim() && !detail.uploadBatchId?.trim()) return groups;
  return groups.map((g) => ({
    ...g,
    uploads: g.uploads.map((u) =>
      rowMatchesRollPatch(u, detail)
        ? {
            ...u,
            review_title: detail.reviewTitle,
            caption: detail.caption,
            camera: detail.camera,
            shot_iso: detail.shot_iso,
            lens: detail.lens,
            lab: detail.lab,
            scanner: detail.scanner,
            format: detail.format,
            location: detail.location,
            shot_date: detail.shot_date,
            tags: detail.tags,
          }
        : u
    ),
  }));
}

function gallerySettingsLine(img: Pick<GalleryImage, "format" | "location" | "shot_date" | "tags" | "shot_iso" | "lens" | "lab" | "scanner" | "push_pull">): string {
  const parts = [
    img.format,
    img.location,
    img.shot_date,
    img.tags,
    img.shot_iso,
    img.lens,
    img.lab?.trim() ? filmLabPublicLabel(img.lab) : "",
    img.push_pull,
    img.scanner,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** Keeps Discover / Community grid + lightbox seed in sync after a roll metadata PATCH. */
export function patchGalleryImagesWithRollMetadata(
  images: GalleryImage[],
  detail: RollMetadataUpdatedDetail
): GalleryImage[] {
  if (!detail.reviewId.trim() && !detail.uploadBatchId?.trim()) return images;
  return images.map((img) => {
    const matchReview = detail.reviewId.trim() && (img.reviewId?.trim() ?? "") === detail.reviewId.trim();
    const matchBatch =
      detail.uploadBatchId?.trim() &&
      (img.uploadBatchId?.trim() ?? "") === detail.uploadBatchId.trim();
    if (!matchReview && !matchBatch) return img;
    const next: GalleryImage = {
      ...img,
      reviewTitle: detail.reviewTitle,
      caption: detail.caption,
      camera: detail.camera?.trim() ? detail.camera : "",
      shot_iso: detail.shot_iso,
      lens: detail.lens,
      lab: detail.lab,
      scanner: detail.scanner,
      format: detail.format,
      location: detail.location,
      shot_date: detail.shot_date,
      tags: detail.tags,
    };
    return { ...next, settings: gallerySettingsLine(next) };
  });
}

export function patchFilmUploadRowsWithRollMetadata(
  rows: FilmUploadRow[],
  detail: RollMetadataUpdatedDetail
): FilmUploadRow[] {
  if (!detail.reviewId.trim() && !detail.uploadBatchId?.trim()) return rows;
  return rows.map((u) =>
    rowMatchesRollPatch(u, detail)
      ? {
          ...u,
          caption: detail.caption,
          camera: detail.camera,
          shot_iso: detail.shot_iso,
          lens: detail.lens,
          lab: detail.lab,
          scanner: detail.scanner,
          format: detail.format,
          location: detail.location,
          shot_date: detail.shot_date,
          tags: detail.tags,
        }
      : u
  );
}
