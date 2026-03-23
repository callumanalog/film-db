"use client";

import Link from "next/link";
import type { GalleryImage } from "@/lib/sample-images";

/** One cell in the Discover / film scans native masonry grid. */
export type FilmNativeMasonryItem = {
  id: string;
  imageUrl: string | null;
  overlayLabel: string;
  href: string;
};

/**
 * Zero-gap 2-column masonry feed with 1px white "frame" border per image.
 * Full-width, no horizontal padding; images keep natural aspect ratio.
 * Use inside a full-bleed wrapper (e.g. `w-screen … -translate-x-1/2`) when page has horizontal padding.
 */
export function FilmNativeMasonryGrid({
  items,
  ariaLabel = "Community uploads",
}: {
  items: FilmNativeMasonryItem[];
  ariaLabel?: string;
}) {
  return (
    <div className="w-full columns-2 gap-0" aria-label={ariaLabel}>
      {items.map((img) => (
        <Link key={img.id} href={img.href} className="block break-inside-avoid">
          <div className="relative box-border overflow-hidden rounded-none border border-white bg-white">
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
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end px-2 py-2 font-sans text-label text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              aria-hidden
            >
              <span className="text-tiny">{img.overlayLabel}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

interface FilmNativeGridProps {
  images: GalleryImage[];
}

export function FilmNativeGrid({ images }: FilmNativeGridProps) {
  const items: FilmNativeMasonryItem[] = images.map((img) => ({
    id: img.galleryId,
    imageUrl: img.imageUrl ?? null,
    overlayLabel: img.stockName,
    href: `/films/${img.stockSlug}/images`,
  }));
  return <FilmNativeMasonryGrid items={items} />;
}
