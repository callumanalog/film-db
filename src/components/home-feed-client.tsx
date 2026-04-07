"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from "react";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import {
  collectLightboxSlidesFromGalleryImages,
  findGalleryImageForLightboxSlide,
  relatedGalleryLightboxSlidesForStock,
  type FilmStockLightboxSummary,
} from "@/lib/lightbox-group";
import type { GalleryImage } from "@/lib/sample-images";
import { cn } from "@/lib/utils";
import { filmLabPublicLabel } from "@/lib/film-lab-queries";
import type { HomeFeedGroup } from "@/app/actions/home-feed";
import {
  patchHomeFeedGroups,
  ROLL_METADATA_UPDATED_EVENT,
  type RollMetadataUpdatedDetail,
} from "@/lib/roll-metadata-updated-event";

function buildFeedGalleryPool(
  groups: HomeFeedGroup[],
  stockLabelBySlug: Record<string, string>,
  lightboxStockBySlug: Record<string, FilmStockLightboxSummary>
): GalleryImage[] {
  const out: GalleryImage[] = [];
  for (const g of groups) {
    const summ = lightboxStockBySlug[g.film_stock_slug];
    const stockName =
      summ?.name ?? stockLabelBySlug[g.film_stock_slug] ?? g.film_stock_slug.replace(/-/g, " ");
    const brandName = summ?.brandName ?? "";
    for (const u of g.uploads) {
      if (!u.image_url?.trim()) continue;
      const settingsParts = [
        u.format,
        u.location,
        u.shot_date,
        u.tags,
        u.shot_iso,
        u.lens,
        u.lab?.trim() ? filmLabPublicLabel(u.lab) : "",
        u.push_pull,
        u.scanner,
      ].filter(Boolean);
      out.push({
        id: u.id,
        galleryId: `upload-${u.id}`,
        stockSlug: u.film_stock_slug,
        stockName,
        brandName,
        stockIso: summ?.iso ?? null,
        stockFormat: summ?.format ?? [],
        stockImageUrl: summ?.image_url ?? null,
        userId: u.user_id,
        username: u.display_name?.trim() || "Member",
        camera: u.camera ?? "",
        location: u.location ?? null,
        settings: settingsParts.join(" · "),
        likes: Number(u.like_count ?? 0),
        saves: Number(u.save_count ?? 0),
        source: "community",
        imageUrl: u.image_url,
        caption: u.caption,
        shot_iso: u.shot_iso,
        lens: u.lens,
        lab: u.lab,
        scanner: u.scanner,
        push_pull: u.push_pull,
        format: u.format ?? null,
        shot_date: u.shot_date ?? null,
        tags: u.tags ?? null,
        reviewId: u.review_id ?? null,
        reviewTitle: u.review_title ?? null,
        uploadBatchId: u.upload_batch_id?.trim() ? u.upload_batch_id : null,
        uploadId: u.id,
        avatarUrl: u.avatar_url ?? null,
      });
    }
  }
  return out;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

function FeedImage({
  src,
  alt,
  className,
  /** When true, image is limited by a fixed-height carousel cell (not 85dvh). */
  fitParent,
  onLoad,
}: {
  src: string;
  alt: string;
  className?: string;
  fitParent?: boolean;
  onLoad?: (e: SyntheticEvent<HTMLImageElement>) => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      className={cn(
        "block object-contain",
        fitParent ? "h-auto max-h-full w-full" : "h-auto max-h-[85dvh] w-full",
        className
      )}
      sizes="(max-width: 768px) 100vw, 720px"
      loading="lazy"
    />
  );
}

function HomeFeedPost({
  group,
  stockLabel,
  onOpenImage,
}: {
  group: HomeFeedGroup;
  stockLabel: string;
  onOpenImage: (uploadId: string) => void;
}) {
  const primary = group.uploads[0]!;
  const username = primary.display_name?.trim() || "Member";

  const slides = group.uploads.filter((u): u is typeof u & { image_url: string } => Boolean(u.image_url));
  const isRoll = slides.length > 1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const carouselViewportRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewportWidthPx, setViewportWidthPx] = useState(0);
  const [heightCapPx, setHeightCapPx] = useState(() =>
    typeof window !== "undefined"
      ? Math.round(
          Math.min(
            window.innerHeight * 0.85,
            (window.visualViewport?.height ?? window.innerHeight) * 0.85
          )
        )
      : 900
  );
  /** Fallback when DB dimensions are missing (legacy rows). */
  const [naturalById, setNaturalById] = useState<Record<string, { w: number; h: number }>>({});

  useEffect(() => {
    setActiveSlide(0);
    const el = scrollerRef.current;
    if (el && isRoll) el.scrollTo({ left: 0 });
  }, [group.key, isRoll]);

  useLayoutEffect(() => {
    const outer = carouselViewportRef.current;
    if (!outer || !isRoll) return;
    const update = () => {
      setViewportWidthPx(outer.clientWidth);
      if (typeof window !== "undefined") {
        const vv = window.visualViewport?.height ?? window.innerHeight;
        setHeightCapPx(
          Math.round(Math.min(window.innerHeight * 0.85, Math.min(vv, window.innerHeight) * 0.85))
        );
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [isRoll, group.key]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !isRoll) return;
    const sync = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const idx = Math.round(el.scrollLeft / w);
      setActiveSlide(Math.min(Math.max(idx, 0), slides.length - 1));
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [isRoll, slides.length, group.key]);

  const activeUpload = slides[activeSlide]!;
  const dbW =
    typeof activeUpload.image_width === "number" && activeUpload.image_width > 0
      ? activeUpload.image_width
      : null;
  const dbH =
    typeof activeUpload.image_height === "number" && activeUpload.image_height > 0
      ? activeUpload.image_height
      : null;
  const nat = naturalById[activeUpload.id];
  const dimW = dbW ?? nat?.w ?? null;
  const dimH = dbH ?? nat?.h ?? null;
  const hasDims = dimW != null && dimH != null && dimW > 0 && dimH > 0;

  const rollFrameHeightPx =
    hasDims && viewportWidthPx > 0
      ? Math.min((viewportWidthPx * dimH) / dimW, heightCapPx)
      : null;

  const rollViewportStyle: CSSProperties = hasDims
    ? viewportWidthPx > 0 && rollFrameHeightPx != null
      ? { height: rollFrameHeightPx }
      : { aspectRatio: `${dimW} / ${dimH}`, maxHeight: "85dvh" }
    : { aspectRatio: "3 / 4", maxHeight: "85dvh" };

  const onRollImageLoad = useCallback((uploadId: string, e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth < 1 || img.naturalHeight < 1) return;
    setNaturalById((prev) => {
      if (prev[uploadId]) return prev;
      return { ...prev, [uploadId]: { w: img.naturalWidth, h: img.naturalHeight } };
    });
  }, []);

  return (
    <article className="pb-12 last:pb-0">
      {isRoll ? (
        <div
          ref={carouselViewportRef}
          className="relative w-full max-h-[85dvh] overflow-hidden"
          style={rollViewportStyle}
        >
          <div
            ref={scrollerRef}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Photos from this roll"
          >
            {slides.map((u) => (
              <div
                key={u.id}
                className="flex h-full w-full shrink-0 grow-0 basis-full snap-start items-center justify-center"
              >
                <button
                  type="button"
                  className="flex h-full w-full cursor-pointer items-center justify-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => onOpenImage(u.id)}
                  aria-label={`View scan: ${stockLabel}`}
                >
                  <FeedImage
                    src={u.image_url}
                    alt=""
                    fitParent
                    className="pointer-events-none"
                    onLoad={(e) => onRollImageLoad(u.id, e)}
                  />
                </button>
              </div>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5 px-3"
            role="status"
            aria-label={`${slides.length} photos, showing ${activeSlide + 1} of ${slides.length}`}
          >
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.35)] transition-colors",
                  i === activeSlide ? "bg-white" : "bg-white/55"
                )}
              />
            ))}
          </div>
        </div>
      ) : slides[0] ? (
        <div className="w-full">
          <button
            type="button"
            className="block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => onOpenImage(slides[0]!.id)}
            aria-label={`View scan: ${stockLabel}`}
          >
            <FeedImage src={slides[0].image_url} alt="" className="pointer-events-none" />
          </button>
        </div>
      ) : null}

      <div className="mt-2.5 flex items-start gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={`/users/${group.user_id}`}
            className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-neutral-200 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary dark:bg-white/15"
            aria-label={`View ${username}'s profile`}
          >
            {primary.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.avatar_url} alt="" className="h-full w-full object-cover" width={24} height={24} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold leading-none text-neutral-700 dark:text-white">
                {getInitials(username)}
              </div>
            )}
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <Link
              href={`/users/${group.user_id}`}
              className="min-w-0 flex-1 basis-0 truncate text-xs font-medium leading-tight text-foreground outline-none ring-offset-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
            >
              {username}
            </Link>
            <Link
              href={`/films/${group.film_stock_slug}`}
              className="min-w-0 max-w-[min(50%,11rem)] shrink truncate text-right text-xs font-normal text-[#8A8A8A] outline-none ring-offset-2 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-primary dark:hover:text-neutral-300"
            >
              {stockLabel}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HomeFeedClient({
  initialGroups,
  stockLabelBySlug,
  lightboxStockBySlug = {},
}: {
  initialGroups: HomeFeedGroup[];
  stockLabelBySlug: Record<string, string>;
  lightboxStockBySlug?: Record<string, FilmStockLightboxSummary>;
}) {
  const router = useRouter();
  const [feedGroups, setFeedGroups] = useState(initialGroups);
  useEffect(() => {
    setFeedGroups(initialGroups);
  }, [initialGroups]);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<RollMetadataUpdatedDetail>).detail;
      if (!d?.reviewId) return;
      setFeedGroups((prev) => patchHomeFeedGroups(prev, d));
    };
    window.addEventListener(ROLL_METADATA_UPDATED_EVENT, handler);
    return () => window.removeEventListener(ROLL_METADATA_UPDATED_EVENT, handler);
  }, []);

  useEffect(() => {
    const refreshHomeFeed = () => router.refresh();
    window.addEventListener("film-upload-complete", refreshHomeFeed);
    window.addEventListener("review-submitted", refreshHomeFeed);
    return () => {
      window.removeEventListener("film-upload-complete", refreshHomeFeed);
      window.removeEventListener("review-submitted", refreshHomeFeed);
    };
  }, [router]);

  const feedGalleryImages = useMemo(
    () => buildFeedGalleryPool(feedGroups, stockLabelBySlug, lightboxStockBySlug),
    [feedGroups, stockLabelBySlug, lightboxStockBySlug]
  );

  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    return relatedGalleryLightboxSlidesForStock(lightboxSession.slides[0]!, feedGalleryImages);
  }, [lightboxSession, feedGalleryImages]);

  const openFeedLightbox = useCallback(
    (uploadId: string) => {
      const clicked = feedGalleryImages.find((i) => i.uploadId === uploadId);
      if (!clicked) return;
      setLightboxSession(collectLightboxSlidesFromGalleryImages(feedGalleryImages, clicked));
    },
    [feedGalleryImages]
  );

  if (feedGroups.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm font-medium text-muted-foreground">
          No posts yet. Follow people and film stocks, or post your own scans to see them here.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Use <span className="font-medium text-foreground">Follow</span> on a film stock page to add its community uploads to your feed.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-8 sm:px-6 md:pb-8">
        {feedGroups.map((group) => {
          const label =
            stockLabelBySlug[group.film_stock_slug] ?? group.film_stock_slug.replace(/-/g, " ");
          return (
            <HomeFeedPost
              key={group.key}
              group={group}
              stockLabel={label}
              onOpenImage={openFeedLightbox}
            />
          );
        })}
      </div>
      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={(slide) => {
            const img = findGalleryImageForLightboxSlide(slide, feedGalleryImages);
            if (img) setLightboxSession(collectLightboxSlidesFromGalleryImages(feedGalleryImages, img));
          }}
        />
      ) : null}
    </>
  );
}

export function HomeFeedSignedOut() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <h1 className="text-xl font-bold tracking-tight">Home</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Log in to see scans from people and stocks you follow, plus your own posts.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent("/")}`}
          className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Log in
        </Link>
        <Link href="/auth/sign-up" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
