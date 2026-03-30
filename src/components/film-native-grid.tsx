"use client";

import Link from "next/link";
import type { GalleryImage } from "@/lib/sample-images";
import { cn } from "@/lib/utils";
export { galleryImageToLightbox } from "@/lib/lightbox-group";

/** One cell in the Discover / film scans native masonry grid. */
export type FilmNativeMasonryItem = {
  id: string;
  imageUrl: string | null;
  overlayLabel: string;
  href: string;
  /** Opens lightbox / custom action; when set, row is a button instead of a link. */
  onActivate?: () => void;
  /** When false, no bottom overlay (e.g. lightbox “more from this roll”). Default: show if overlayLabel is non-empty. */
  showOverlay?: boolean;
};

/**
 * Zero-gap 2-column masonry feed with 1px white "frame" border per image.
 * Full-width within its container; images keep natural aspect ratio (CSS columns masonry).
 * For edge-to-edge on a padded page, wrap with e.g. `-mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)]` (matches `px-4 sm:px-6`).
 */
export function FilmNativeMasonryGrid({
  items,
  ariaLabel = "Community uploads",
  frameClassName,
}: {
  items: FilmNativeMasonryItem[];
  ariaLabel?: string;
  /** Merged onto each image frame; default matches Discover (white borders). */
  frameClassName?: string;
}) {
  return (
    <div className="w-full columns-2 gap-0" aria-label={ariaLabel}>
      {items.map((img) => {
        const showBottomOverlay =
          img.showOverlay !== false && img.overlayLabel.trim().length > 0;
        const inner = (
          <div
            className={cn(
              "relative box-border overflow-hidden rounded-none border border-white bg-white",
              frameClassName
            )}
          >
            {img.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.imageUrl}
                alt=""
                className="block h-auto w-full"
                sizes="50vw"
                loading="lazy"
              />
            ) : (
              <div className="aspect-[3/2] w-full bg-gray-100" aria-hidden />
            )}
            {showBottomOverlay ? (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end px-2 py-2 font-sans text-label text-white"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                aria-hidden
              >
                <span className="text-tiny">{img.overlayLabel}</span>
              </div>
            ) : null}
          </div>
        );

        if (img.onActivate) {
          return (
            <button
              key={img.id}
              type="button"
              className="block w-full cursor-pointer break-inside-avoid border-0 bg-transparent p-0 text-left"
              onClick={img.onActivate}
            >
              {inner}
            </button>
          );
        }

        return (
          <Link key={img.id} href={img.href} className="block break-inside-avoid">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

interface FilmNativeGridProps {
  images: GalleryImage[];
  onOpenGalleryImage?: (img: GalleryImage) => void;
}

export function FilmNativeGrid({ images, onOpenGalleryImage }: FilmNativeGridProps) {
  const items: FilmNativeMasonryItem[] = images.map((img) => ({
    id: img.galleryId,
    imageUrl: img.imageUrl ?? null,
    overlayLabel: img.stockName,
    href: `/films/${img.stockSlug}/images`,
    onActivate: onOpenGalleryImage ? () => onOpenGalleryImage(img) : undefined,
  }));
  return <FilmNativeMasonryGrid items={items} />;
}
