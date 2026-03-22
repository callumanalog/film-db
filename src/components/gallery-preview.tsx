"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera } from "lucide-react";
import type { FlickrPhoto } from "@/lib/flickr";
import {
  getUploadsForFilmStock,
  type FilmUploadRow,
} from "@/app/actions/uploads";
import { LazyImage } from "@/components/lazy-image";

const PREVIEW_COUNT = 5;

interface GalleryPreviewProps {
  slug: string;
  stockName: string;
  flickrImages?: FlickrPhoto[];
}

type PreviewImage = {
  id: string;
  imageUrl: string;
  alt: string;
  username?: string;
};

export function GalleryPreview({
  slug,
  stockName,
  flickrImages = [],
}: GalleryPreviewProps) {
  const [uploads, setUploads] = useState<FilmUploadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getUploadsForFilmStock(slug)
      .then(setUploads)
      .finally(() => setLoading(false));
  }, [slug]);

  const images: PreviewImage[] = [];

  for (const u of uploads) {
    if (images.length >= PREVIEW_COUNT) break;
    if (!u.image_url?.trim()) continue;
    images.push({
      id: u.id,
      imageUrl: u.image_url!,
      alt: u.caption ?? "",
      username: u.display_name ?? undefined,
    });
  }

  for (const f of flickrImages) {
    if (images.length >= PREVIEW_COUNT) break;
    images.push({
      id: f.id,
      imageUrl: f.imageUrl,
      alt: f.title || "",
      username: f.ownerName,
    });
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const childWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth
      : 1;
    const index = Math.round(scrollLeft / childWidth);
    setActiveIndex(Math.min(index, images.length - 1));
  }, [images.length]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="aspect-[3/2] animate-pulse rounded-[7px] bg-muted" />
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return <UploadCTA stockName={stockName} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        >
          {images.map((img) => (
            <div
              key={img.id}
              className="w-full shrink-0 snap-start"
            >
              <div className="aspect-[3/2] overflow-hidden rounded-[7px]">
                <LazyImage
                  src={img.imageUrl}
                  alt={img.alt}
                  wrapperClassName="h-full w-full"
                  className="!h-full !w-full !max-h-none object-cover"
                  sizes="100vw"
                />
              </div>
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <span
                key={img.id}
                className={`block h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <UploadCTA stockName={stockName} />
    </div>
  );
}

function UploadCTA({ stockName }: { stockName: string }) {
  return (
    <button
      type="button"
      className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-white px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-primary"
    >
      <Camera className="size-5 shrink-0" aria-hidden />
      Add your own scans
    </button>
  );
}
