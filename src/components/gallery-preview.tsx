"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Camera } from "lucide-react";
import type { FlickrPhoto } from "@/lib/flickr";
import {
  getUploadsForFilmStock,
  getMyUploadsForFilmStock,
  getFollowingUploadsForFilmStock,
  type FilmUploadRow,
} from "@/app/actions/uploads";
import { plainTextFromPossibleHtml } from "@/lib/sanitize-review-like-html";
import { LazyImage } from "@/components/lazy-image";
import {
  FilmNativeMasonryGrid,
  type FilmNativeMasonryItem,
} from "@/components/film-native-grid";
import { SegmentedViewTabs, type SegmentedView } from "@/components/segmented-view-tabs";
import { useAuth } from "@/context/auth-context";

const PREVIEW_COUNT = 5;

interface GalleryPreviewProps {
  slug: string;
  stockName: string;
  flickrImages?: FlickrPhoto[];
  /** `masonry` = same 2-col full-bleed grid as Discover; `carousel` = overview strip. */
  layout?: "carousel" | "masonry";
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
  layout = "carousel",
}: GalleryPreviewProps) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<FilmUploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scansView, setScansView] = useState<SegmentedView>("everyone");

  useEffect(() => {
    if (!slug) {
      setUploads([]);
      setLoading(false);
      return;
    }
    if (layout === "carousel") {
      setLoading(true);
      getUploadsForFilmStock(slug)
        .then(setUploads)
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    const fetcher =
      scansView === "you"
        ? getMyUploadsForFilmStock(slug)
        : scansView === "following"
          ? getFollowingUploadsForFilmStock(slug)
          : getUploadsForFilmStock(slug);
    fetcher
      .then(setUploads)
      .finally(() => setLoading(false));
  }, [slug, layout, scansView]);

  const galleryHref = `/films/${slug}/images`;

  const masonryItems: FilmNativeMasonryItem[] = useMemo(() => {
    const items: FilmNativeMasonryItem[] = [];
    for (const u of uploads) {
      if (!u.image_url?.trim()) continue;
      items.push({
        id: `u-${u.id}`,
        imageUrl: u.image_url!,
        overlayLabel: u.display_name?.trim() || "Member",
        href: galleryHref,
      });
    }
    if (scansView === "everyone") {
      for (const f of flickrImages) {
        items.push({
          id: `f-${f.id}`,
          imageUrl: f.imageUrl,
          overlayLabel: f.ownerName?.trim() || "Flickr",
          href: galleryHref,
        });
      }
    }
    return items;
  }, [uploads, flickrImages, galleryHref, scansView]);

  const images: PreviewImage[] = [];

  for (const u of uploads) {
    if (images.length >= PREVIEW_COUNT) break;
    if (!u.image_url?.trim()) continue;
    images.push({
      id: u.id,
      imageUrl: u.image_url!,
      alt: plainTextFromPossibleHtml(u.caption ?? ""),
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
    if (layout === "masonry") {
      return (
        <div className="space-y-5">
          <SegmentedViewTabs
            value={scansView}
            onChange={setScansView}
            ariaLabel="Whose scans to show"
          />
          <div className="w-screen max-w-none relative left-1/2 -translate-x-1/2">
            <div className="w-full columns-2 gap-0" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="box-border border border-white bg-white">
                    <div className="aspect-[3/4] w-full animate-pulse bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
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

  if (layout === "masonry") {
    const showFollowingEmpty =
      !loading && scansView === "following" && masonryItems.length === 0;
    const showYouEmpty = !loading && scansView === "you" && masonryItems.length === 0;
    const followingEmptyMessage = !user
      ? "Sign in to see scans from people you follow."
      : "No scans from people you follow for this film yet.";

    return (
      <div className="space-y-5">
        <SegmentedViewTabs
          value={scansView}
          onChange={setScansView}
          ariaLabel="Whose scans to show"
        />

        {showFollowingEmpty ? (
          <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">{followingEmptyMessage}</p>
          </div>
        ) : null}

        {showYouEmpty ? (
          <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              You haven’t uploaded scans for this film yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add photos from the toolbar to see them here.
            </p>
          </div>
        ) : null}

        {!showFollowingEmpty && !showYouEmpty && masonryItems.length > 0 ? (
          <div className="w-screen max-w-none relative left-1/2 -translate-x-1/2">
            <FilmNativeMasonryGrid
              items={masonryItems}
              ariaLabel={`${stockName} community scans`}
            />
          </div>
        ) : null}

        <UploadCTA stockName={stockName} />
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
      className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-3 text-sm font-medium text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-muted/50 hover:text-primary dark:border-border dark:shadow-none"
    >
      <Camera className="size-5 shrink-0" aria-hidden />
      Add your own scans
    </button>
  );
}
