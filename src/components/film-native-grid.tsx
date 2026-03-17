"use client";

import Link from "next/link";
import type { GalleryImage } from "@/lib/sample-images";

interface FilmNativeGridProps {
  images: GalleryImage[];
}

/**
 * Zero-gap 2-column masonry feed with 1px white "frame" border per image.
 * Full-width, no horizontal padding; images keep natural aspect ratio.
 */
export function FilmNativeGrid({ images }: FilmNativeGridProps) {
  return (
    <div
      className="w-full columns-2 gap-0"
      aria-label="Community uploads"
    >
      {images.map((img) => (
        <Link
          key={img.galleryId}
          href={`/films/${img.stockSlug}/images`}
          className="block break-inside-avoid"
        >
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
            {/* Metadata overlay: non-interactive so tap goes to full-screen */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end px-2 py-2 font-sans text-label text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              aria-hidden
            >
              <span className="text-tiny">{img.stockName}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
