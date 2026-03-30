"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, ChevronLeft, Heart, Info, MessageCircle, MoreVertical } from "lucide-react";
import { getSavedUploadIdsAmong, toggleSaveUpload } from "@/app/actions/saved-uploads";
import {
  getLikedUploadIdsAmong,
  getLikersForUpload,
  toggleLikeUpload,
  type UploadLikerPreview,
} from "@/app/actions/upload-likes";
import { getFollowingIdsAmong, toggleFollowUser } from "@/app/actions/user-follows";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { sanitizeReviewLikeHtml } from "@/lib/sanitize-review-like-html";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilmNativeMasonryGrid, type FilmNativeMasonryItem } from "@/components/film-native-grid";
import { isSameLightboxSlide } from "@/lib/lightbox-group";

export type ImageLightboxMetadata = {
  camera?: string | null;
  shot_iso?: string | null;
  lens?: string | null;
  lab?: string | null;
  filter?: string | null;
  scanner?: string | null;
  push_pull?: string | null;
};

export type ImageLightboxData = {
  imageUrl: string;
  /** `user_uploads.id` when this slide is a real upload; omit for Flickr/samples. */
  uploadId?: string | null;
  alt?: string;
  caption?: string | null;
  username?: string;
  /** Profile image URL; falls back to initials. */
  avatarUrl?: string | null;
  /** Subtitle under username (e.g. shoot location). */
  location?: string | null;
  /** ISO date string for “4 days ago”. */
  createdAt?: string | null;
  /** Shown as “234 likes” when > 0. */
  likeCount?: number | null;
  commentCount?: number | null;
  metadata?: ImageLightboxMetadata;
  /** e.g. film stock — link in details */
  context?: { label: string; href: string };
};

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

function plainCaptionFull(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatRelativeTime(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week} week${week === 1 ? "" : "s"} ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} month${month === 1 ? "" : "s"} ago`;
  const year = Math.floor(day / 365);
  return `${year} year${year === 1 ? "" : "s"} ago`;
}

export type ImageLightboxProps = {
  slides: ImageLightboxData[];
  initialIndex?: number;
  onClose: () => void;
  /** When the open batch is a single image: other shots on the same film stock (masonry under “More from this stock”). */
  relatedStockSlides?: ImageLightboxData[];
  /** Opens the chosen image (parent usually replaces the lightbox session). */
  onPickRelatedStock?: (slide: ImageLightboxData) => void;
};

/**
 * Full-screen lightbox: Instagram-style chrome, hero image, action row, caption; multi-upload batches
 * show sibling frames under “More from this roll” (Discover-style masonry, no stock overlay).
 */
export function ImageLightbox({
  slides,
  initialIndex = 0,
  onClose,
  relatedStockSlides = [],
  onPickRelatedStock,
}: ImageLightboxProps) {
  const safeSlides = slides.length > 0 ? slides : [];
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, safeSlides.length - 1))
  );
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [captionOverflowsTwoLines, setCaptionOverflowsTwoLines] = useState(false);
  const captionClampedRef = useRef<HTMLParagraphElement>(null);
  const [savedUploadIds, setSavedUploadIds] = useState<Set<string>>(() => new Set());
  const [savePending, setSavePending] = useState(false);
  const saveInFlightRef = useRef(false);
  const [likedUploadIds, setLikedUploadIds] = useState<Set<string>>(() => new Set());
  const [likePending, setLikePending] = useState(false);
  const likeInFlightRef = useRef(false);
  const [likeDeltaByUploadId, setLikeDeltaByUploadId] = useState<Record<string, number>>({});
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
  const [likesSheetUploadId, setLikesSheetUploadId] = useState<string | null>(null);
  const [likesList, setLikesList] = useState<UploadLikerPreview[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [followingInLikesSheet, setFollowingInLikesSheet] = useState<Set<string>>(() => new Set());
  const [followPendingUserId, setFollowPendingUserId] = useState<string | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const slideUploadIdsKey = safeSlides.map((s) => s.uploadId?.trim() ?? "").join("|");

  const activeSlideIdentity = useMemo(() => {
    const slide = safeSlides[active];
    if (!slide) return `idx-${active}`;
    return `${slide.uploadId ?? ""}|${slide.imageUrl}`;
  }, [safeSlides, active]);

  useEffect(() => {
    const i = Math.min(Math.max(0, initialIndex), Math.max(0, safeSlides.length - 1));
    setActive(i);
  }, [initialIndex, safeSlides.length]);

  const moreRollItems: FilmNativeMasonryItem[] = useMemo(() => {
    if (safeSlides.length <= 1) return [];
    return safeSlides
      .map((slide, i) => ({ slide, i }))
      .filter(({ i }) => i !== active)
      .map(({ slide, i }) => ({
        id: slide.uploadId ?? `roll-${i}-${slide.imageUrl}`,
        imageUrl: slide.imageUrl,
        overlayLabel: "",
        href: "#",
        showOverlay: false,
        onActivate: () => setActive(i),
      }));
  }, [safeSlides, active]);

  const moreFromStockItems: FilmNativeMasonryItem[] = useMemo(() => {
    if (safeSlides.length !== 1 || !onPickRelatedStock || relatedStockSlides.length === 0) return [];
    const cur = safeSlides[0];
    return relatedStockSlides
      .filter((s) => !isSameLightboxSlide(cur, s))
      .map((slide, idx) => ({
        id: slide.uploadId ?? `stock-${idx}-${slide.imageUrl}`,
        imageUrl: slide.imageUrl,
        overlayLabel: "",
        href: "#",
        showOverlay: false,
        onActivate: () => onPickRelatedStock(slide),
      }));
  }, [safeSlides, relatedStockSlides, onPickRelatedStock]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useLayoutEffect(() => {
    const s = mainScrollRef.current;
    if (s) s.scrollTop = 0;
  }, [activeSlideIdentity]);

  useEffect(() => {
    setCaptionExpanded(false);
    setInfoOpen(false);
  }, [active]);

  useLayoutEffect(() => {
    if (captionExpanded) {
      setCaptionOverflowsTwoLines(false);
      return;
    }
    const slide = safeSlides[active] ?? safeSlides[0];
    const plain = slide?.caption?.trim() ? plainCaptionFull(slide.caption) : "";
    if (!plain) {
      setCaptionOverflowsTwoLines(false);
      return;
    }
    const el = captionClampedRef.current;
    if (!el) {
      setCaptionOverflowsTwoLines(false);
      return;
    }
    const measure = () => {
      setCaptionOverflowsTwoLines(el.scrollHeight > el.clientHeight + 2);
    };
    const id = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [active, captionExpanded, safeSlides]);

  useEffect(() => {
    setLikeDeltaByUploadId({});
  }, [slideUploadIdsKey]);

  useEffect(() => {
    let cancelled = false;
    const ids = safeSlides.map((s) => s.uploadId?.trim()).filter((x): x is string => !!x);
    if (ids.length === 0) {
      setSavedUploadIds(new Set());
      setLikedUploadIds(new Set());
      return;
    }
    if (!user) {
      setSavedUploadIds(new Set());
      setLikedUploadIds(new Set());
      return;
    }
    getSavedUploadIdsAmong(ids).then((saved) => {
      if (!cancelled) setSavedUploadIds(new Set(saved));
    });
    getLikedUploadIdsAmong(ids).then((liked) => {
      if (!cancelled) setLikedUploadIds(new Set(liked));
    });
    return () => {
      cancelled = true;
    };
  }, [slideUploadIdsKey, user?.id, safeSlides.length]);

  const loadLikersSheetWithUser = useCallback(async (uploadId: string) => {
    setLikesLoading(true);
    setLikesList([]);
    const rows = await getLikersForUpload(uploadId);
    setLikesList(rows);
    setLikesLoading(false);
  }, []);

  const openLikesSheet = useCallback(
    (uploadId: string) => {
      setLikesSheetUploadId(uploadId);
      setLikesSheetOpen(true);
      void loadLikersSheetWithUser(uploadId);
    },
    [loadLikersSheetWithUser]
  );

  const onLikesSheetOpenChange = useCallback((open: boolean) => {
    setLikesSheetOpen(open);
    if (!open) {
      setLikesSheetUploadId(null);
      setLikesList([]);
      setFollowingInLikesSheet(new Set());
    }
  }, []);

  const handleFollowInLikesSheet = useCallback(
    async (targetUserId: string) => {
      if (!user) {
        router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
        return;
      }
      setFollowPendingUserId(targetUserId);
      const res = await toggleFollowUser(targetUserId);
      setFollowPendingUserId(null);
      if (!res.ok) {
        if (res.error === "sign_in_required") {
          router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
        }
        return;
      }
      setFollowingInLikesSheet((prev) => {
        const next = new Set(prev);
        if (res.following) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
    },
    [pathname, router, user]
  );

  const handleLikeClick = useCallback(async () => {
    const idx = Math.min(Math.max(0, active), Math.max(0, safeSlides.length - 1));
    const slide = safeSlides[idx];
    const id = slide?.uploadId?.trim() ?? null;
    if (!id || likeInFlightRef.current) return;
    if (!user) {
      router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }
    likeInFlightRef.current = true;
    setLikePending(true);
    const res = await toggleLikeUpload(id);
    likeInFlightRef.current = false;
    setLikePending(false);
    if (!res.ok) {
      if (res.error === "sign_in_required") {
        router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
      }
      return;
    }
    setLikedUploadIds((prev) => {
      const next = new Set(prev);
      if (res.liked) next.add(id);
      else next.delete(id);
      return next;
    });
    setLikeDeltaByUploadId((prev) => {
      const d = prev[id] ?? 0;
      const step = res.liked ? 1 : -1;
      return { ...prev, [id]: d + step };
    });
    if (likesSheetOpen && likesSheetUploadId === id) {
      void loadLikersSheetWithUser(id);
    }
  }, [likesSheetOpen, likesSheetUploadId, loadLikersSheetWithUser, safeSlides, active, pathname, router, user]);

  const handleSaveClick = useCallback(async () => {
    const idx = Math.min(Math.max(0, active), Math.max(0, safeSlides.length - 1));
    const slide = safeSlides[idx];
    const id = slide?.uploadId?.trim() ?? null;
    if (!id || saveInFlightRef.current) return;
    if (!user) {
      router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }
    saveInFlightRef.current = true;
    setSavePending(true);
    const res = await toggleSaveUpload(id);
    saveInFlightRef.current = false;
    setSavePending(false);
    if (!res.ok) {
      if (res.error === "sign_in_required") {
        router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
      }
      return;
    }
    setSavedUploadIds((prev) => {
      const next = new Set(prev);
      if (res.saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }, [safeSlides, active, pathname, router, user]);

  const currentUploadIdForLikesSync =
    safeSlides.length === 0
      ? null
      : (safeSlides[Math.min(Math.max(0, active), Math.max(0, safeSlides.length - 1))]?.uploadId?.trim() ??
        null);

  useEffect(() => {
    if (!likesSheetOpen || !likesSheetUploadId || !currentUploadIdForLikesSync) return;
    if (likesSheetUploadId !== currentUploadIdForLikesSync) {
      onLikesSheetOpenChange(false);
    }
  }, [currentUploadIdForLikesSync, likesSheetOpen, likesSheetUploadId, onLikesSheetOpenChange]);

  useEffect(() => {
    if (!likesSheetOpen || likesList.length === 0) {
      setFollowingInLikesSheet(new Set());
      return;
    }
    if (!user?.id) {
      setFollowingInLikesSheet(new Set());
      return;
    }
    const others = likesList.map((r) => r.userId).filter((id) => id !== user.id);
    if (others.length === 0) {
      setFollowingInLikesSheet(new Set());
      return;
    }
    let cancelled = false;
    getFollowingIdsAmong(others).then((ids) => {
      if (!cancelled) setFollowingInLikesSheet(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [likesList, likesSheetOpen, user?.id]);

  if (safeSlides.length === 0) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const current = safeSlides[active] ?? safeSlides[0];
  const hasMeta =
    current.metadata &&
    (current.metadata.camera ||
      current.metadata.shot_iso ||
      current.metadata.lens ||
      current.metadata.lab ||
      current.metadata.filter ||
      current.metadata.scanner ||
      current.metadata.push_pull);

  const name = current.username?.trim() || "Member";
  const subtitle =
    current.location?.trim() ||
    current.context?.label ||
    null;
  const relativeTime = current.createdAt ? formatRelativeTime(current.createdAt) : null;
  const captionPlain = current.caption?.trim() ? plainCaptionFull(current.caption) : "";

  const comments = current.commentCount ?? null;

  const currentUploadId = current.uploadId?.trim() ?? null;
  const canSave = !!currentUploadId;
  const isSaved = currentUploadId ? savedUploadIds.has(currentUploadId) : false;
  const isLiked = currentUploadId ? likedUploadIds.has(currentUploadId) : false;
  const baseLikeCount = current.likeCount ?? 0;
  const likeDelta = currentUploadId ? (likeDeltaByUploadId[currentUploadId] ?? 0) : 0;
  const displayLikes = Math.max(0, baseLikeCount + likeDelta);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white text-neutral-900 dark:bg-black dark:text-neutral-100"
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top: back + Explore */}
        <div className="flex shrink-0 items-center gap-1 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-0.5 rounded-lg py-2 pl-1 pr-2 -ml-1 text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
            aria-label="Back to Explore"
          >
            <ChevronLeft className="h-7 w-7 shrink-0 stroke-[1.75]" />
            <span className="text-base font-semibold tracking-tight">Explore</span>
          </button>
        </div>

        {/* User row */}
        <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-3 pb-3 dark:border-white/10">
          <div
            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200 ring-1 ring-neutral-300 dark:bg-white/15 dark:ring-white/10"
            aria-hidden
          >
            {current.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-neutral-700 dark:text-white">
                {getInitials(name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{name}</p>
            {subtitle ? (
              <p className="truncate text-xs font-normal text-neutral-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full p-2 text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5 stroke-[1.75]" />
          </button>
        </header>

        <div
          ref={mainScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        >
          {/* Hero image (batch siblings appear under “More from this roll” below the caption). */}
          <div className="w-full bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.imageUrl}
              alt={current.alt ?? ""}
              className="block w-full object-contain"
              style={{ maxHeight: "min(72vh, 900px)" }}
              sizes="100vw"
            />
          </div>

          {/* Action bar — directly under image */}
          <div className="flex items-center justify-between px-3 pt-1 pb-2 sm:pt-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center">
                <button
                  type="button"
                  disabled={!currentUploadId || likePending}
                  onClick={() => void handleLikeClick()}
                  className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-35 sm:p-1.5 dark:text-neutral-100 dark:hover:bg-white/10 dark:disabled:opacity-35"
                  aria-label={isLiked ? "Unlike" : "Like"}
                  aria-pressed={isLiked}
                >
                  <Heart
                    className={`h-6 w-6 stroke-[1.75] sm:h-5 sm:w-5 sm:stroke-[1.5] ${isLiked ? "fill-primary text-primary" : ""}`}
                  />
                </button>
                {currentUploadId && displayLikes > 0 ? (
                  <button
                    type="button"
                    onClick={() => openLikesSheet(currentUploadId)}
                    className="-ml-0.5 pr-0.5 text-left text-sm font-semibold tabular-nums text-neutral-800 sm:text-xs dark:text-neutral-100"
                    aria-label={`${displayLikes.toLocaleString()} likes, view list`}
                  >
                    {displayLikes.toLocaleString()}
                  </button>
                ) : null}
              </span>
              <span className="flex items-center">
                <button
                  type="button"
                  className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 sm:p-1.5 dark:text-neutral-100 dark:hover:bg-white/10"
                  aria-label="Comment"
                >
                  <MessageCircle className="h-6 w-6 stroke-[1.75] sm:h-5 sm:w-5 sm:stroke-[1.5]" />
                </button>
                {comments != null ? (
                  <span className="-ml-0.5 pr-0.5 text-sm font-normal tabular-nums sm:text-xs">{comments}</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 sm:p-1.5 dark:text-neutral-100 dark:hover:bg-white/10"
                aria-label="Photo details"
              >
                <Info className="h-6 w-6 stroke-[1.75] sm:h-5 sm:w-5 sm:stroke-[1.5]" />
              </button>
            </div>
            <button
              type="button"
              disabled={!canSave || savePending}
              onClick={() => void handleSaveClick()}
              className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-35 sm:p-1.5 dark:text-neutral-100 dark:hover:bg-white/10 dark:disabled:opacity-35"
              aria-label={isSaved ? "Remove from saved" : "Save"}
              aria-pressed={isSaved}
            >
              <Bookmark
                className={`h-6 w-6 stroke-[1.75] sm:h-5 sm:w-5 sm:stroke-[1.5] ${isSaved ? "fill-current" : ""}`}
              />
            </button>
          </div>

          <div className="space-y-3 px-3 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+12px))]">
            {/* Caption (username in header only; collapsed = 2 lines + trailing "more") */}
            {current.caption?.trim() ? (
              <div className="relative text-sm leading-relaxed">
                {!captionExpanded ? (
                  <>
                    <p
                      ref={captionClampedRef}
                      className="text-neutral-900 dark:text-neutral-100 line-clamp-2 break-words"
                    >
                      {captionPlain}
                    </p>
                    {captionOverflowsTwoLines ? (
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-l from-white from-40% to-transparent pl-10 dark:from-black">
                        <button
                          type="button"
                          onClick={() => setCaptionExpanded(true)}
                          className="pointer-events-auto text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400"
                        >
                          more
                        </button>
                      </span>
                    ) : null}
                  </>
                ) : (
                  <div
                    className="text-neutral-900 [&_a]:text-blue-600 [&_a]:underline dark:text-neutral-100 dark:[&_a]:text-blue-400 [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-2 dark:[&_blockquote]:border-white/25 [&_p]:m-0 [&_p]:mb-2 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{ __html: sanitizeReviewLikeHtml(current.caption) }}
                  />
                )}
              </div>
            ) : null}

            {moreRollItems.length > 0 ? (
              <div className="space-y-2 pt-8">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                  More from this roll
                </h3>
                <div className="min-w-0 -mx-3 w-[calc(100%+1.5rem)]">
                  <FilmNativeMasonryGrid
                    items={moreRollItems}
                    ariaLabel="More from this roll"
                    frameClassName="border-neutral-200 bg-white dark:border-white"
                  />
                </div>
              </div>
            ) : moreFromStockItems.length > 0 ? (
              <div className="space-y-2 pt-8">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                  More from this stock
                </h3>
                <div className="min-w-0 -mx-3 w-[calc(100%+1.5rem)]">
                  <FilmNativeMasonryGrid
                    items={moreFromStockItems}
                    ariaLabel="More from this stock"
                    frameClassName="border-neutral-200 bg-white dark:border-white"
                  />
                </div>
              </div>
            ) : null}

            {relativeTime ? (
              <p className="text-xs uppercase tracking-wide text-neutral-500">{relativeTime}</p>
            ) : null}

            {!current.caption?.trim() &&
            !relativeTime &&
            !(displayLikes > 0) &&
            !current.context &&
            !hasMeta &&
            !current.location?.trim() ? (
              <p className="text-sm text-neutral-500">No caption for this shot.</p>
            ) : null}
          </div>
        </div>
      </div>

      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent
          side="bottom"
          overlayClassName="z-[105]"
          className="z-[110] gap-0 p-0"
          showCloseButton
        >
          <SheetHeader className="border-b border-border px-4 pb-3 pt-2 text-left">
            <SheetTitle>Photo details</SheetTitle>
          </SheetHeader>
          <div className="max-h-[min(70dvh,520px)] overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {current.context ? (
              <div className="mb-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Film stock
                </h2>
                <p className="mt-1.5">
                  <Link
                    href={current.context.href}
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => {
                      setInfoOpen(false);
                      onClose();
                    }}
                  >
                    {current.context.label}
                  </Link>
                </p>
              </div>
            ) : null}

            {current.location?.trim() ? (
              <div className="mb-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Location
                </h2>
                <p className="mt-1.5 text-sm text-foreground">{current.location.trim()}</p>
              </div>
            ) : null}

            {relativeTime ? (
              <div className="mb-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Posted
                </h2>
                <p className="mt-1.5 text-sm text-foreground">{relativeTime}</p>
              </div>
            ) : null}

            {hasMeta ? (
              <div className="space-y-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Camera &amp; processing
                </h2>
                <dl className="space-y-2.5 text-sm">
                  {current.metadata!.camera ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Camera
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.camera}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.shot_iso ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Shot at ISO
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.shot_iso}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.lens ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Lens
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.lens}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.lab ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Lab / processing
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.lab}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.push_pull ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Push / pull
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.push_pull}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.filter ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Filter
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.filter}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.scanner ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Scanner
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.scanner}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {!current.context && !current.location?.trim() && !relativeTime && !hasMeta ? (
              <p className="text-sm text-muted-foreground">No extra details for this photo.</p>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={likesSheetOpen} onOpenChange={onLikesSheetOpenChange}>
        <SheetContent
          side="bottom"
          overlayClassName="z-[115]"
          className="z-[120] gap-0 border-t-0 p-0"
          showCloseButton
        >
          <div
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600"
            aria-hidden
          />
          <SheetHeader className="border-b border-neutral-200 px-4 pb-3 pt-1 text-center dark:border-white/10">
            <SheetTitle className="font-sans text-base font-bold text-neutral-900 dark:text-neutral-100">
              Likes
            </SheetTitle>
          </SheetHeader>
          <div className="max-h-[min(72dvh,560px)] overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {likesLoading ? (
              <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
            ) : likesList.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">No likes yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-white/10">
                {likesList.map((liker) => {
                  const isSelf = user?.id === liker.userId;
                  const isFollowing = followingInLikesSheet.has(liker.userId);
                  return (
                    <li key={liker.userId} className="flex items-center gap-3 py-3">
                      <Link
                        href={`/users/${liker.userId}`}
                        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg py-0.5 pr-1 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-800 dark:bg-white/15 dark:text-white"
                          aria-hidden
                        >
                          {getInitials(liker.displayName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {liker.displayName}
                          </p>
                        </div>
                      </Link>
                      {isSelf ? (
                        <span className="inline-flex w-[92px] shrink-0 justify-end" aria-hidden />
                      ) : !user ? (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`)
                          }
                          className="min-w-[92px] shrink-0 rounded-md bg-primary px-3 py-1.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Follow
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={followPendingUserId === liker.userId}
                          onClick={() => void handleFollowInLikesSheet(liker.userId)}
                          className={cn(
                            "min-w-[92px] shrink-0 rounded-md px-3 py-1.5 text-center text-sm font-semibold transition-colors disabled:opacity-50",
                            isFollowing
                              ? "border border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-white/20 dark:bg-white/10 dark:text-white"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          {followPendingUserId === liker.userId
                            ? "…"
                            : isFollowing
                              ? "Following"
                              : "Follow"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>,
    document.body
  );
}
