"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  Camera,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Heart,
  MessageCircle,
  MoreHorizontal,
  RectangleHorizontal,
  Tags,
} from "lucide-react";
import { getSavedUploadIdsAmong, toggleSaveUpload } from "@/app/actions/saved-uploads";
import { showSavedScanBoardToast } from "@/components/saved-scan-board-toast";
import {
  getLikedUploadIdsAmong,
  getLikersForUpload,
  toggleLikeUpload,
  type UploadLikerPreview,
} from "@/app/actions/upload-likes";
import { getFollowingIdsAmong, toggleFollowUser } from "@/app/actions/user-follows";
import { useAuth } from "@/context/auth-context";
import {
  topLeftNavChevronIconClassName,
  topLeftNavIconButtonClassName,
  topRightNavIconButtonClassName,
} from "@/lib/top-left-nav-icon";
import { mobileHeaderRowClassName, mobileHeaderSafeAreaStyle } from "@/lib/mobile-header";
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
  /** Upload / scan format (e.g. 35mm); shown in metadata table. */
  format?: string | null;
  lens?: string | null;
  lab?: string | null;
  filter?: string | null;
  scanner?: string | null;
  push_pull?: string | null;
  /** `user_uploads.shot_date` as `YYYY-MM-DD`. */
  shot_date?: string | null;
  /** `user_uploads.tags` (comma-separated). */
  tags?: string | null;
};

export type ImageLightboxData = {
  imageUrl: string;
  /** `user_uploads.id` when this slide is a real upload; omit for Flickr/samples. */
  uploadId?: string | null;
  /** When set, header avatar/name link to `/users/{userId}`. */
  userId?: string | null;
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
  /** Film stock for under-caption metadata (name + link; image/specLine optional for other surfaces). */
  stockCard?: {
    name: string;
    specLine: string;
    imageUrl?: string | null;
    brandInitial?: string;
    href: string;
  } | null;
};

const lightboxMetaHairline = "border-t border-[0.5px] border-border/40 dark:border-white/15";

/** Leading row icons: 16×16, muted tertiary */
const lightboxMetaLeadingIconClass =
  "size-4 shrink-0 stroke-[1.5] text-muted-foreground/80 dark:text-muted-foreground/70";

/** Trailing chevron: 14×14, muted tertiary */
const lightboxMetaChevronClass =
  "h-3.5 w-3.5 shrink-0 stroke-[1.5] text-muted-foreground/80 dark:text-muted-foreground/70";

function formatIsoRowValue(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return /^\s*ISO\b/i.test(t) ? t : `ISO ${t}`;
}

function formatShotDateLabel(isoDate: string): string {
  const t = isoDate.trim();
  if (!t) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return t;
  try {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return t;
  }
}

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
  const [chromeMenuOpen, setChromeMenuOpen] = useState(false);
  const chromeMenuRef = useRef<HTMLDivElement>(null);

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
    if (!chromeMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (chromeMenuRef.current && !chromeMenuRef.current.contains(e.target as Node)) {
        setChromeMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChromeMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [chromeMenuOpen]);

  useLayoutEffect(() => {
    const s = mainScrollRef.current;
    if (s) s.scrollTop = 0;
  }, [activeSlideIdentity]);

  useEffect(() => {
    setCaptionExpanded(false);
    setInfoOpen(false);
  }, [active]);

  useLayoutEffect(() => {
    let overflowTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleCaptionOverflow = (value: boolean) => {
      if (overflowTimeout != null) clearTimeout(overflowTimeout);
      overflowTimeout = setTimeout(() => {
        overflowTimeout = null;
        setCaptionOverflowsTwoLines(value);
      }, 0);
    };

    if (captionExpanded) {
      scheduleCaptionOverflow(false);
      return () => {
        if (overflowTimeout != null) clearTimeout(overflowTimeout);
      };
    }
    const slide = safeSlides[active] ?? safeSlides[0];
    const plain = slide?.caption?.trim() ? plainCaptionFull(slide.caption) : "";
    if (!plain) {
      scheduleCaptionOverflow(false);
      return () => {
        if (overflowTimeout != null) clearTimeout(overflowTimeout);
      };
    }
    const el = captionClampedRef.current;
    if (!el) {
      scheduleCaptionOverflow(false);
      return () => {
        if (overflowTimeout != null) clearTimeout(overflowTimeout);
      };
    }
    const measure = () => {
      scheduleCaptionOverflow(el.scrollHeight > el.clientHeight + 2);
    };
    const id = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      if (overflowTimeout != null) clearTimeout(overflowTimeout);
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [active, captionExpanded, safeSlides]);

  useEffect(() => {
    setLikeDeltaByUploadId({});
  }, [slideUploadIdsKey]);

  useEffect(() => {
    let cancelled = false;
    let savedDefer: ReturnType<typeof setTimeout> | null = null;
    let likedDefer: ReturnType<typeof setTimeout> | null = null;
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
      if (cancelled) return;
      savedDefer = setTimeout(() => {
        savedDefer = null;
        if (!cancelled) setSavedUploadIds(new Set(saved));
      }, 0);
    });
    getLikedUploadIdsAmong(ids).then((liked) => {
      if (cancelled) return;
      likedDefer = setTimeout(() => {
        likedDefer = null;
        if (!cancelled) setLikedUploadIds(new Set(liked));
      }, 0);
    });
    return () => {
      cancelled = true;
      if (savedDefer != null) clearTimeout(savedDefer);
      if (likedDefer != null) clearTimeout(likedDefer);
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
    if (res.saved) {
      void showSavedScanBoardToast(id);
    }
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
    let followDefer: ReturnType<typeof setTimeout> | null = null;
    getFollowingIdsAmong(others).then((ids) => {
      if (cancelled) return;
      followDefer = setTimeout(() => {
        followDefer = null;
        if (!cancelled) setFollowingInLikesSheet(new Set(ids));
      }, 0);
    });
    return () => {
      cancelled = true;
      if (followDefer != null) clearTimeout(followDefer);
    };
  }, [likesList, likesSheetOpen, user?.id]);

  if (safeSlides.length === 0) {
    return null;
  }

  const current = safeSlides[active] ?? safeSlides[0];
  const hasMeta =
    current.metadata &&
    (current.metadata.camera ||
      current.metadata.shot_iso ||
      current.metadata.format?.trim() ||
      current.metadata.lens ||
      current.metadata.lab ||
      current.metadata.filter ||
      current.metadata.scanner ||
      current.metadata.push_pull ||
      current.metadata.shot_date?.trim() ||
      current.metadata.tags?.trim());

  const name = current.username?.trim() || "Member";
  const profileUserId = current.userId?.trim() ?? "";
  const profileHref = profileUserId ? `/users/${profileUserId}` : null;
  const relativeTime = current.createdAt ? formatRelativeTime(current.createdAt) : null;
  const filmStockName = current.stockCard?.name ?? current.context?.label ?? null;
  const filmStockHref = current.stockCard?.href ?? current.context?.href ?? null;
  const showFilmMetaRow = !!(filmStockName && filmStockHref);
  const cameraValue = current.metadata?.camera?.trim() ?? "";
  const shotIsoValue = current.metadata?.shot_iso?.trim() ?? "";
  const formatValue = current.metadata?.format?.trim() ?? "";
  const shotDateValue = current.metadata?.shot_date?.trim() ?? "";
  const tagsValue = current.metadata?.tags?.trim() ?? "";
  const hasMetadataTable =
    showFilmMetaRow ||
    !!cameraValue ||
    !!shotIsoValue ||
    !!formatValue ||
    !!shotDateValue ||
    !!tagsValue;
  const captionPlain = current.caption?.trim() ? plainCaptionFull(current.caption) : "";

  const comments = current.commentCount ?? null;

  const currentUploadId = current.uploadId?.trim() ?? null;
  const canSave = !!currentUploadId;
  const isSaved = currentUploadId ? savedUploadIds.has(currentUploadId) : false;
  const isLiked = currentUploadId ? likedUploadIds.has(currentUploadId) : false;
  const baseLikeCount = current.likeCount ?? 0;
  const likeDelta = currentUploadId ? (likeDeltaByUploadId[currentUploadId] ?? 0) : 0;
  const displayLikes = Math.max(0, baseLikeCount + likeDelta);

  const avatarBlock = (
    <div
      className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/15"
      aria-hidden
    >
      {current.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.avatarUrl} alt="" className="h-full w-full object-cover" width={24} height={24} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold leading-none text-neutral-700 dark:text-white">
          {getInitials(name)}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Sheet
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="z-[100]"
          className={cn(
            "z-[100] gap-0 border-0 bg-white p-0 text-neutral-900 shadow-xl dark:bg-black dark:text-neutral-100",
            // Flush to all viewport edges (avoids gaps from h-dvh vs layout viewport on mobile).
            "data-[side=bottom]:inset-0 data-[side=bottom]:h-auto data-[side=bottom]:max-h-none data-[side=bottom]:rounded-none data-[side=bottom]:border-t-0"
          )}
        >
          <SheetTitle className="sr-only">Photo</SheetTitle>
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex shrink-0 flex-col" style={mobileHeaderSafeAreaStyle}>
              <div
                className={cn(
                  mobileHeaderRowClassName,
                  "text-neutral-900 dark:text-neutral-100"
                )}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    topLeftNavIconButtonClassName,
                    "text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
                  )}
                  aria-label="Back"
                >
                  <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
                </button>
                <div className="relative" ref={chromeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setChromeMenuOpen((o) => !o)}
                    className={cn(
                      topRightNavIconButtonClassName,
                      "text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
                    )}
                    aria-label="More options"
                    aria-expanded={chromeMenuOpen}
                  >
                    <MoreHorizontal className="size-6 stroke-[1.75]" />
                  </button>
                  {chromeMenuOpen ? (
                    <div
                      className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-neutral-900"
                      role="menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full px-4 py-2.5 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
                        onClick={() => {
                          setChromeMenuOpen(false);
                          setInfoOpen(true);
                        }}
                      >
                        Photo details
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              ref={mainScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="w-full bg-neutral-100 dark:bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.imageUrl}
                  alt={current.alt ?? ""}
                  className="block max-h-[min(85dvh,900px)] w-full object-cover"
                  sizes="100vw"
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      onClick={onClose}
                      className="shrink-0 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`View ${name}'s profile`}
                    >
                      {avatarBlock}
                    </Link>
                  ) : (
                    avatarBlock
                  )}
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      onClick={onClose}
                      className="min-w-0 truncate text-[14px] font-medium leading-tight text-neutral-900 outline-none ring-offset-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary dark:text-neutral-100"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate text-[14px] font-medium leading-tight text-neutral-900 dark:text-neutral-100">
                      {name}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <span className="flex items-center">
                    <button
                      type="button"
                      disabled={!currentUploadId || likePending}
                      onClick={() => void handleLikeClick()}
                      className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-35 dark:text-neutral-100 dark:hover:bg-white/10 dark:disabled:opacity-35"
                      aria-label={isLiked ? "Unlike" : "Like"}
                      aria-pressed={isLiked}
                    >
                      <Heart
                        className={`h-5 w-5 stroke-[1.5] ${isLiked ? "fill-primary text-primary" : ""}`}
                      />
                    </button>
                    {currentUploadId && displayLikes > 0 ? (
                      <button
                        type="button"
                        onClick={() => openLikesSheet(currentUploadId)}
                        className="-ml-0.5 pr-0.5 text-left text-xs font-medium tabular-nums text-neutral-800 dark:text-neutral-100"
                        aria-label={`${displayLikes.toLocaleString()} likes, view list`}
                      >
                        {displayLikes.toLocaleString()}
                      </button>
                    ) : null}
                  </span>
                  <span className="flex items-center">
                    <button
                      type="button"
                      className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
                      aria-label="Comment"
                    >
                      <MessageCircle className="h-5 w-5 stroke-[1.5]" />
                    </button>
                    {comments != null ? (
                      <span className="-ml-0.5 pr-0.5 text-xs font-normal tabular-nums text-neutral-600 dark:text-neutral-300">
                        {comments}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    disabled={!canSave || savePending}
                    onClick={() => void handleSaveClick()}
                    className="rounded-full p-2 text-neutral-800 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-35 dark:text-neutral-100 dark:hover:bg-white/10 dark:disabled:opacity-35"
                    aria-label={isSaved ? "Remove from saved" : "Save"}
                    aria-pressed={isSaved}
                  >
                    <Bookmark className={`h-5 w-5 stroke-[1.5] ${isSaved ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+12px))]">
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

                {hasMetadataTable ? (
                  <div className="-mx-4 flex flex-col">
                    {showFilmMetaRow ? (
                      <Link
                        href={filmStockHref!}
                        onClick={onClose}
                        className={cn(
                          lightboxMetaHairline,
                          "flex min-h-11 items-center pl-4 pr-4 text-left transition-colors hover:bg-secondary/70 active:bg-secondary dark:hover:bg-secondary/50 dark:active:bg-secondary/70"
                        )}
                      >
                        <Film className={cn(lightboxMetaLeadingIconClass, "mr-3")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-foreground">
                          {filmStockName}
                        </span>
                        <ChevronRight className={cn(lightboxMetaChevronClass, "ml-2 shrink-0")} aria-hidden />
                      </Link>
                    ) : null}
                    {cameraValue ? (
                      <Link
                        href={`/cameras?search=${encodeURIComponent(cameraValue)}`}
                        onClick={onClose}
                        className={cn(
                          lightboxMetaHairline,
                          "flex min-h-11 items-center pl-4 pr-4 text-left transition-colors hover:bg-secondary/70 active:bg-secondary dark:hover:bg-secondary/50 dark:active:bg-secondary/70"
                        )}
                      >
                        <Camera className={cn(lightboxMetaLeadingIconClass, "mr-3")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-foreground">
                          {cameraValue}
                        </span>
                        <ChevronRight className={cn(lightboxMetaChevronClass, "ml-2 shrink-0")} aria-hidden />
                      </Link>
                    ) : null}
                    {shotIsoValue ? (
                      <div className={cn(lightboxMetaHairline, "flex min-h-11 items-center pl-4 pr-4")}>
                        <Clock className={cn(lightboxMetaLeadingIconClass, "mr-3")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-muted-foreground">
                          {formatIsoRowValue(shotIsoValue)}
                        </span>
                      </div>
                    ) : null}
                    {formatValue ? (
                      <div className={cn(lightboxMetaHairline, "flex min-h-11 items-center pl-4 pr-4")}>
                        <RectangleHorizontal
                          className={cn(lightboxMetaLeadingIconClass, "mr-3")}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-muted-foreground">
                          {formatValue}
                        </span>
                      </div>
                    ) : null}
                    {shotDateValue ? (
                      <div className={cn(lightboxMetaHairline, "flex min-h-11 items-center pl-4 pr-4")}>
                        <CalendarDays
                          className={cn(lightboxMetaLeadingIconClass, "mr-3")}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-muted-foreground">
                          {formatShotDateLabel(shotDateValue)}
                        </span>
                      </div>
                    ) : null}
                    {tagsValue ? (
                      <div className={cn(lightboxMetaHairline, "flex min-h-11 items-center pl-4 pr-4")}>
                        <Tags className={cn(lightboxMetaLeadingIconClass, "mr-3")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-muted-foreground">
                          {tagsValue}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {moreRollItems.length > 0 ? (
                  <div className="space-y-2 pt-6">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                      More from this roll
                    </h3>
                    <div className="min-w-0 -mx-4 w-[calc(100%+2rem)]">
                      <FilmNativeMasonryGrid
                        items={moreRollItems}
                        ariaLabel="More from this roll"
                        frameClassName="border-neutral-200 bg-white dark:border-white"
                      />
                    </div>
                  </div>
                ) : moreFromStockItems.length > 0 ? (
                  <div className="space-y-2 pt-6">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                      More from this stock
                    </h3>
                    <div className="min-w-0 -mx-4 w-[calc(100%+2rem)]">
                      <FilmNativeMasonryGrid
                        items={moreFromStockItems}
                        ariaLabel="More from this stock"
                        frameClassName="border-neutral-200 bg-white dark:border-white"
                      />
                    </div>
                  </div>
                ) : null}

                {!current.caption?.trim() && !(displayLikes > 0) && !hasMetadataTable ? (
                  <p className="text-sm text-neutral-500">No caption for this shot.</p>
                ) : null}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
                  {current.metadata!.format?.trim() ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Format
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.format.trim()}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.shot_date?.trim() ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Shot date
                      </dt>
                      <dd className="mt-0.5 text-foreground">
                        {formatShotDateLabel(current.metadata!.shot_date)}
                      </dd>
                    </div>
                  ) : null}
                  {current.metadata!.tags?.trim() ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Tags
                      </dt>
                      <dd className="mt-0.5 text-foreground">{current.metadata!.tags.trim()}</dd>
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
    </>
  );
}
