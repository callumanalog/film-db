"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { FlickrPhoto } from "@/lib/flickr";
import {
  getUploadsForFilmStock,
  getMyUploadsForFilmStock,
  getFollowingUploadsForFilmStock,
  type FilmUploadRow,
} from "@/app/actions/uploads";
import { plainTextFromPossibleHtml } from "@/lib/sanitize-review-like-html";
import {
  DiscoverRailStrip,
  type DiscoverRailCarouselItem,
} from "@/components/discover-rail-carousel";
import {
  FilmNativeMasonryGrid,
  type FilmNativeMasonryItem,
} from "@/components/film-native-grid";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import {
  buildLightboxStockCard,
  collectLightboxSlidesFromFilmUploads,
  relatedFilmPageLightboxSlides,
  type FilmStockLightboxSummary,
} from "@/lib/lightbox-group";
import { SegmentedViewTabs, type SegmentedView } from "@/components/segmented-view-tabs";
import { useAuth } from "@/context/auth-context";

const PREVIEW_COUNT = 5;

interface GalleryPreviewProps {
  slug: string;
  stockName: string;
  flickrImages?: FlickrPhoto[];
  /** `masonry` = same 2-col full-bleed grid as Discover; `carousel` = overview strip. */
  layout?: "carousel" | "masonry";
  /** When set, lightbox shows @ stock row with brand | ISO | formats. */
  lightboxStockSummary?: FilmStockLightboxSummary | null;
}

type PreviewImage = {
  id: string;
  imageUrl: string;
  alt: string;
  username?: string;
  /** Set for community uploads — used for discover-rail profile links. */
  userId?: string;
  lightbox: ImageLightboxData;
};

export function GalleryPreview({
  slug,
  stockName,
  flickrImages = [],
  layout = "carousel",
  lightboxStockSummary = null,
}: GalleryPreviewProps) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<FilmUploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scansView, setScansView] = useState<SegmentedView>("everyone");
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);
  const [imageDimensionsById, setImageDimensionsById] = useState<
    Record<string, { width: number; height: number }>
  >({});

  useEffect(() => {
    setImageDimensionsById({});
  }, [slug]);

  useEffect(() => {
    setImageDimensionsById((prev) => {
      const next = { ...prev };
      for (const u of uploads) {
        if (next[u.id]) continue;
        const w = u.image_width;
        const h = u.image_height;
        if (w != null && h != null && w > 0 && h > 0) {
          next[u.id] = { width: w, height: h };
        }
      }
      return next;
    });
  }, [uploads]);

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

  const flickrForRelatedPool =
    layout === "carousel" ? flickrImages : scansView === "everyone" ? flickrImages : [];

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    return relatedFilmPageLightboxSlides(
      lightboxSession.slides[0],
      uploads,
      flickrForRelatedPool,
      stockName,
      slug,
      lightboxStockSummary
    );
  }, [lightboxSession, uploads, flickrForRelatedPool, stockName, slug, lightboxStockSummary]);

  const handlePickRelatedStock = useCallback(
    (slide: ImageLightboxData) => {
      const u = uploads.find((x) => x.id === slide.uploadId);
      if (u) {
        setLightboxSession(
          collectLightboxSlidesFromFilmUploads(uploads, u, stockName, slug, lightboxStockSummary)
        );
        return;
      }
      const f = flickrImages.find((x) => x.imageUrl === slide.imageUrl);
      if (f) {
        setLightboxSession({
          slides: [
            {
              imageUrl: f.imageUrl,
              alt: f.title || `${stockName} on Flickr`,
              caption: f.title?.trim() || null,
              username: f.ownerName,
              context: { label: stockName, href: `/films/${slug}` },
              stockCard: buildLightboxStockCard(slug, stockName, lightboxStockSummary),
            },
          ],
          initialIndex: 0,
        });
      }
    },
    [uploads, flickrImages, stockName, slug, lightboxStockSummary]
  );

  const handleRailImageLoad = useCallback((id: string, width: number, height: number) => {
    setImageDimensionsById((prev) => {
      const current = prev[id];
      if (current && current.width === width && current.height === height) return prev;
      return { ...prev, [id]: { width, height } };
    });
  }, []);

  const masonryItems: FilmNativeMasonryItem[] = useMemo(() => {
    const items: FilmNativeMasonryItem[] = [];
    for (const u of uploads) {
      if (!u.image_url?.trim()) continue;
      items.push({
        id: `u-${u.id}`,
        imageUrl: u.image_url!,
        overlayLabel: u.display_name?.trim() || "Member",
        href: galleryHref,
        onActivate: () =>
          setLightboxSession(
            collectLightboxSlidesFromFilmUploads(uploads, u, stockName, slug, lightboxStockSummary)
          ),
      });
    }
    if (scansView === "everyone") {
      for (const f of flickrImages) {
        items.push({
          id: `f-${f.id}`,
          imageUrl: f.imageUrl,
          overlayLabel: f.ownerName?.trim() || "Flickr",
          href: galleryHref,
          onActivate: () =>
            setLightboxSession({
              slides: [
                {
                  imageUrl: f.imageUrl,
                  alt: f.title || `${stockName} on Flickr`,
                  caption: f.title?.trim() || null,
                  username: f.ownerName,
                  context: { label: stockName, href: `/films/${slug}` },
                  stockCard: buildLightboxStockCard(slug, stockName, lightboxStockSummary),
                },
              ],
              initialIndex: 0,
            }),
        });
      }
    }
    return items;
  }, [uploads, flickrImages, galleryHref, scansView, slug, stockName, lightboxStockSummary]);

  const images: PreviewImage[] = useMemo(() => {
    const out: PreviewImage[] = [];
    for (const u of uploads) {
      if (out.length >= PREVIEW_COUNT) break;
      if (!u.image_url?.trim()) continue;
      out.push({
        id: u.id,
        imageUrl: u.image_url!,
        alt: plainTextFromPossibleHtml(u.caption ?? ""),
        username: u.display_name ?? undefined,
        userId: u.user_id,
        lightbox: {
          imageUrl: u.image_url!,
          uploadId: u.id,
          userId: u.user_id,
          alt:
            plainTextFromPossibleHtml(u.caption ?? "").slice(0, 240) ||
            `${stockName} · ${u.display_name ?? "Member"}`,
          caption: u.caption,
          username: u.display_name?.trim() || "Member",
          location: u.location?.trim() || null,
          createdAt: u.created_at ?? null,
          context: { label: stockName, href: `/films/${slug}` },
          stockCard: buildLightboxStockCard(slug, stockName, lightboxStockSummary),
          metadata: {
            camera: u.camera,
            shot_iso: u.shot_iso,
            lens: u.lens,
            lab: u.lab,
            scanner: u.scanner,
            push_pull: u.push_pull,
          },
        },
      });
    }

    for (const f of flickrImages) {
      if (out.length >= PREVIEW_COUNT) break;
      out.push({
        id: f.id,
        imageUrl: f.imageUrl,
        alt: f.title || "",
        username: f.ownerName,
        lightbox: {
          imageUrl: f.imageUrl,
          alt: f.title || `${stockName} on Flickr`,
          caption: f.title?.trim() || null,
          username: f.ownerName,
          context: { label: stockName, href: `/films/${slug}` },
          stockCard: buildLightboxStockCard(slug, stockName, lightboxStockSummary),
        },
      });
    }
    return out;
  }, [uploads, flickrImages, stockName, slug, lightboxStockSummary]);

  const railItems: DiscoverRailCarouselItem[] = useMemo(
    () =>
      images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        imageAlt: img.alt?.trim() ? img.alt : stockName,
        username: img.username ?? null,
        userId: img.userId ?? null,
      })),
    [images, stockName]
  );

  const handleRailOpen = useCallback(
    (id: string) => {
      const u = uploads.find((x) => x.id === id);
      if (u) {
        setLightboxSession(
          collectLightboxSlidesFromFilmUploads(uploads, u, stockName, slug, lightboxStockSummary)
        );
        return;
      }
      const img = images.find((x) => x.id === id);
      if (img) {
        setLightboxSession({ slides: [img.lightbox], initialIndex: 0 });
      }
    },
    [uploads, images, stockName, slug, lightboxStockSummary]
  );

  if (loading) {
    if (layout === "masonry") {
      return (
        <div className="space-y-5">
          <SegmentedViewTabs
            value={scansView}
            onChange={setScansView}
            ariaLabel="Whose scans to show"
          />
          <div className="min-w-0 w-full">
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
      <div className="-mx-4 overflow-hidden">
        <div className="flex gap-2 overflow-x-hidden px-4 pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[180px] w-[135px] shrink-0 animate-pulse bg-muted sm:h-[260px] sm:w-[195px] lg:h-[300px] lg:w-[225px]"
              aria-hidden
            />
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
          <div className="min-w-0 w-full">
            <FilmNativeMasonryGrid items={masonryItems} ariaLabel={`${stockName} community scans`} />
          </div>
        ) : null}

        {lightboxSession ? (
          <ImageLightbox
            slides={lightboxSession.slides}
            initialIndex={lightboxSession.initialIndex}
            onClose={() => setLightboxSession(null)}
            relatedStockSlides={relatedStockSlides}
            onPickRelatedStock={handlePickRelatedStock}
          />
        ) : null}
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <DiscoverRailStrip
        items={railItems}
        imageDimensionsById={imageDimensionsById}
        onImageLoad={handleRailImageLoad}
        onOpenItem={handleRailOpen}
        bleedX
      />

      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={handlePickRelatedStock}
        />
      ) : null}
    </div>
  );
}
