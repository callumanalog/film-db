"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AddReviewModal,
  type AddReviewModalPayload,
  type EditShareRollSeed,
  type TrackFilmModalStock,
} from "@/components/add-review-modal";
import {
  patchReviewModalSubmission,
  patchRollModalSubmission,
} from "@/lib/user-reviews-client-submit";
import {
  dispatchRollMetadataUpdated,
  getRollMetadataPatchForRoll,
  type RollMetadataUpdatedDetail,
} from "@/lib/roll-metadata-updated-event";
import { showToastViaEvent } from "@/components/toast";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Aperture,
  Bookmark,
  Camera,
  ChevronLeft,
  FlaskConical,
  Gauge,
  Heart,
  MessageCircle,
  MoreHorizontal,
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
import { filmLabPublicLabel } from "@/lib/film-lab-queries";
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
  scanner?: string | null;
  push_pull?: string | null;
  /** `user_uploads.shot_date` as `YYYY-MM-DD`. */
  shot_date?: string | null;
  /** `user_uploads.tags` (comma-separated). */
  tags?: string | null;
  /** `user_uploads.location` (free-text place name). */
  location?: string | null;
};

export type ImageLightboxData = {
  imageUrl: string;
  /** `user_uploads.id` when this slide is a real upload; omit for Flickr/samples. */
  uploadId?: string | null;
  /** `reviews.id` when this slide is part of a shared roll (same id for all frames in the roll). */
  reviewId?: string | null;
  /** `user_uploads.upload_batch_id` when part of a multi-scan batch (may exist without `review_id` on legacy rows). */
  uploadBatchId?: string | null;
  /** Canonical roll id (`rolls.id`) when available. */
  rollId?: string | null;
  /** `reviews.review_title` when known (e.g. own profile lightbox). */
  rollTitle?: string | null;
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
  /** `user_uploads.film_stock_slug` / gallery stock slug; avoids relying on href parsing alone. */
  filmStockSlug?: string | null;
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

/** 40×40 thumbnail shell — matches list cards (`border border-border`, rounded box). */
const lightboxMetaThumbShell =
  "relative mr-3 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[7px] border border-border bg-white dark:bg-card";

/** Camera row: same gutter width as thumbnails, no border; icon aligned to title line. */
const lightboxMetaCameraIconColumn =
  "mr-3 flex w-10 shrink-0 flex-col items-center justify-start pt-px";

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

function formatCaptionTags(rawTags: string): string {
  return rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/^#+/, "").replace(/\s+/g, "").toLowerCase())
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(" ");
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

function plainCaptionFull(html: string): string {
  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/div>\s*<div[^>]*>/gi, "\n");
  const stripped = withLineBreaks.replace(/<[^>]+>/g, "");
  return stripped
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
    .join("\n")
    .trim();
}

function buildEditShareRollSeed(
  slides: ImageLightboxData[],
  rollIdForPatch: string | null,
  reviewIdForPatch: string,
  match: {
    priorReviewId?: string | null;
    uploadBatchId?: string | null;
    uploadId?: string | null;
  }
): EditShareRollSeed | null {
  const ridForPatch = reviewIdForPatch.trim();
  if (!ridForPatch) return null;
  const pr = match.priorReviewId?.trim();
  const bid = match.uploadBatchId?.trim();
  const uid = match.uploadId?.trim();
  let rollSlides: ImageLightboxData[];
  if (pr) {
    rollSlides = slides.filter((s) => (s.reviewId?.trim() ?? "") === pr);
  } else if (bid) {
    rollSlides = slides.filter((s) => (s.uploadBatchId?.trim() ?? "") === bid);
  } else if (uid) {
    rollSlides = slides.filter((s) => (s.uploadId?.trim() ?? "") === uid);
  } else {
    return null;
  }
  if (rollSlides.length === 0) return null;
  const first = rollSlides[0]!;
  const meta = first.metadata ?? {};
  const batchId = first.uploadBatchId?.trim() ?? null;
  const base: EditShareRollSeed = {
    rollId: rollIdForPatch,
    reviewId: ridForPatch,
    uploadBatchId: batchId,
    imageUrls: rollSlides.map((s) => s.imageUrl),
    imageWidths: rollSlides.map(() => null),
    imageHeights: rollSlides.map(() => null),
    rollName: first.rollTitle?.trim() ?? "",
    caption: first.caption?.trim() ? plainCaptionFull(first.caption) : "",
    camera: meta.camera?.trim() ?? "",
    lens: meta.lens?.trim() ?? "",
    location: (first.location ?? first.metadata?.location)?.trim() ?? "",
    shotDate: meta.shot_date?.trim() ?? "",
    tags: meta.tags?.trim() ?? "",
    lab: meta.lab?.trim() ?? "",
    scanner: meta.scanner?.trim() ?? "",
    shotIso: meta.shot_iso?.trim() ?? "",
    selectedFormat: meta.format?.trim() ?? "",
  };
  const patch = getRollMetadataPatchForRoll(ridForPatch, batchId);
  if (!patch) return base;
  return {
    ...base,
    rollName: patch.reviewTitle ?? "",
    caption: patch.caption ?? "",
    camera: patch.camera ?? "",
    lens: patch.lens ?? "",
    location: patch.location ?? "",
    shotDate: patch.shot_date ?? "",
    tags: patch.tags ?? "",
    lab: patch.lab ?? "",
    scanner: patch.scanner ?? "",
    shotIso: patch.shot_iso ?? "",
    selectedFormat: patch.format ?? "",
  };
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
  const [captionOverflowsFiveLines, setCaptionOverflowsFiveLines] = useState(false);
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
  const [rollOwnerSheetOpen, setRollOwnerSheetOpen] = useState(false);
  const [rollDeleteSheetOpen, setRollDeleteSheetOpen] = useState(false);
  const [deleteRollTarget, setDeleteRollTarget] = useState<{
    reviewId?: string;
    uploadBatchId?: string;
    uploadId?: string;
  } | null>(null);
  const [deleteRollPending, setDeleteRollPending] = useState(false);
  const [editRollOpen, setEditRollOpen] = useState(false);
  const [editRollSeed, setEditRollSeed] = useState<EditShareRollSeed | null>(null);

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

  useLayoutEffect(() => {
    const s = mainScrollRef.current;
    if (s) s.scrollTop = 0;
  }, [activeSlideIdentity]);

  useEffect(() => {
    setCaptionExpanded(false);
  }, [active]);

  useLayoutEffect(() => {
    let overflowTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleCaptionOverflow = (value: boolean) => {
      if (overflowTimeout != null) clearTimeout(overflowTimeout);
      overflowTimeout = setTimeout(() => {
        overflowTimeout = null;
        setCaptionOverflowsFiveLines(value);
      }, 0);
    };

    if (captionExpanded) {
      scheduleCaptionOverflow(false);
      return () => {
        if (overflowTimeout != null) clearTimeout(overflowTimeout);
      };
    }
    const slide = safeSlides[active] ?? safeSlides[0];
    const patch = getRollMetadataPatchForRoll(slide?.reviewId, slide?.uploadBatchId);
    const plain = patch
      ? (patch.caption?.trim() ? patch.caption.trim() : "")
      : slide?.caption?.trim()
        ? plainCaptionFull(slide.caption)
        : "";
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

  const currentForHooks =
    safeSlides.length > 0 ? (safeSlides[active] ?? safeSlides[0]) : undefined;
  const filmStockHrefForRoll =
    currentForHooks?.stockCard?.href ?? currentForHooks?.context?.href ?? null;
  const filmStockSlugFromHref = useMemo(() => {
    if (!filmStockHrefForRoll?.startsWith("/films/")) return "";
    return filmStockHrefForRoll.slice("/films/".length).split(/[/?#]/)[0] ?? "";
  }, [filmStockHrefForRoll]);

  const resolvedFilmStockSlug = (
    currentForHooks?.filmStockSlug?.trim() ||
    filmStockSlugFromHref ||
    ""
  ).trim();

  const profileUserIdForRoll = currentForHooks?.userId?.trim() ?? "";
  const authId = user?.id?.trim() ?? "";
  const isOwnLightboxUpload =
    !!authId &&
    !!profileUserIdForRoll &&
    authId.toLowerCase() === profileUserIdForRoll.toLowerCase();

  const ownUploadIdForRoll = currentForHooks?.uploadId?.trim() ?? "";
  const canOwnerManageRoll =
    isOwnLightboxUpload && !!resolvedFilmStockSlug && !!ownUploadIdForRoll;

  const editRollModalStock: TrackFilmModalStock = useMemo(() => {
    if (!currentForHooks) {
      return {
        slug: "unknown",
        name: "Film",
        brand: { name: "", slug: "" },
        format: [],
        image_url: null,
        iso: null,
      };
    }
    const href = currentForHooks.context?.href ?? currentForHooks.stockCard?.href ?? "";
    const slug =
      (currentForHooks.filmStockSlug?.trim() ||
        (href.startsWith("/films/")
          ? href.slice("/films/".length).split(/[/?#]/)[0] ?? ""
          : "")) ||
      "";
    const stockName = currentForHooks.stockCard?.name ?? currentForHooks.context?.label ?? slug;
    const brandTok = currentForHooks.stockCard?.specLine?.split("·")[0]?.trim() ?? "";
    return {
      slug: slug || "unknown",
      name: stockName || "Film",
      brand: { name: brandTok, slug: "" },
      format: [],
      image_url: currentForHooks.stockCard?.imageUrl ?? null,
      iso: null,
    };
  }, [currentForHooks]);

  const handleEditRollSubmit = useCallback(
    async (payload: AddReviewModalPayload) => {
      if (!user || !editRollSeed || !resolvedFilmStockSlug) {
        return { success: false as const };
      }
      const outcome = editRollSeed.rollId?.trim()
        ? await patchRollModalSubmission({
            rollId: editRollSeed.rollId.trim(),
            filmStockSlug: resolvedFilmStockSlug,
            payload,
          })
        : await patchReviewModalSubmission({
            reviewId: editRollSeed.reviewId,
            filmStockSlug: resolvedFilmStockSlug,
            payload,
            mode: "upload",
          });
      if (!outcome.ok) {
        showToastViaEvent(outcome.toast);
        return { success: false as const };
      }
      const metaDetail: RollMetadataUpdatedDetail = {
        reviewId: editRollSeed.reviewId,
        uploadBatchId: editRollSeed.uploadBatchId ?? null,
        reviewTitle: payload.reviewTitle?.trim() ? payload.reviewTitle.trim() : null,
        caption: payload.caption?.trim() ? payload.caption.trim() : null,
        camera: payload.camera?.trim() || null,
        shot_iso: payload.shotIso?.trim() || null,
        lens: payload.lens?.trim() || null,
        lab: payload.lab?.trim() || null,
        scanner: payload.scanner?.trim() || null,
        format: payload.format?.trim() || null,
        location: payload.location?.trim() || null,
        shot_date: payload.shotDate?.trim() || null,
        tags: payload.tags?.trim() || null,
      };
      dispatchRollMetadataUpdated(metaDetail);
      window.dispatchEvent(
        new CustomEvent("film-upload-complete", { detail: { slug: resolvedFilmStockSlug } })
      );
      window.dispatchEvent(
        new CustomEvent("review-submitted", { detail: { slug: resolvedFilmStockSlug } })
      );
      showToastViaEvent("Roll updated.");
      setEditRollOpen(false);
      setEditRollSeed(null);
      router.refresh();
      return { success: true as const };
    },
    [user, editRollSeed, resolvedFilmStockSlug, router]
  );

  const confirmDeleteOwnRoll = useCallback(async () => {
    if (!user || !deleteRollTarget) return;
    setDeleteRollPending(true);
    try {
      let res: Response;
      const rid = deleteRollTarget.reviewId?.trim();
      if (rid) {
        res = await fetch(`/api/user/reviews/${encodeURIComponent(rid)}`, { method: "DELETE" });
      } else {
        res = await fetch("/api/user/uploads/delete-own-roll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            upload_batch_id: deleteRollTarget.uploadBatchId?.trim() || undefined,
            upload_id: deleteRollTarget.uploadId?.trim() || undefined,
          }),
        });
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToastViaEvent(data.error || "Could not delete roll");
        return;
      }
      showToastViaEvent("Roll deleted.");
      if (resolvedFilmStockSlug) {
        window.dispatchEvent(
          new CustomEvent("review-submitted", { detail: { slug: resolvedFilmStockSlug } })
        );
      }
      setRollDeleteSheetOpen(false);
      setDeleteRollTarget(null);
      router.refresh();
      onClose();
    } finally {
      setDeleteRollPending(false);
    }
  }, [user, deleteRollTarget, resolvedFilmStockSlug, onClose, router]);

  const openEditRollFlow = useCallback(async () => {
    const slide = safeSlides[active] ?? safeSlides[0];
    if (!slide?.uploadId?.trim()) {
      showToastViaEvent("This photo cannot be edited here.");
      return;
    }
    setRollOwnerSheetOpen(false);
    let reviewIdForPatch = slide.reviewId?.trim() ?? "";
    let rollIdForPatch = slide.rollId?.trim() ?? "";
    try {
      const body = reviewIdForPatch
        ? { review_id: reviewIdForPatch }
        : slide.uploadBatchId?.trim()
          ? { upload_batch_id: slide.uploadBatchId.trim() }
          : { upload_id: slide.uploadId.trim() };
      const resolvedRes = await fetch("/api/user/rolls/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resolvedData = (await resolvedRes.json().catch(() => ({}))) as {
        rollId?: string;
        reviewId?: string | null;
        error?: string;
      };
      if (resolvedRes.ok) {
        rollIdForPatch = (resolvedData.rollId ?? "").trim();
        if (!reviewIdForPatch) {
          reviewIdForPatch = (resolvedData.reviewId ?? "").trim();
        }
      }
    } catch {
      // Keep compatibility fallback below.
    }
    if (!reviewIdForPatch) {
      try {
        const body = slide.uploadBatchId?.trim()
          ? { upload_batch_id: slide.uploadBatchId.trim() }
          : { upload_id: slide.uploadId.trim() };
        const res = await fetch("/api/user/uploads/claim-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as {
          reviewId?: string;
          rollId?: string;
          error?: string;
        };
        if (!res.ok) {
          showToastViaEvent(data.error || "Could not open editor for this roll.");
          return;
        }
        reviewIdForPatch = (data.reviewId ?? "").trim();
        if (!rollIdForPatch) {
          rollIdForPatch = (data.rollId ?? "").trim();
        }
        if (!reviewIdForPatch) {
          showToastViaEvent("Could not open editor for this roll.");
          return;
        }
      } catch {
        showToastViaEvent("Could not open editor for this roll.");
        return;
      }
    }
    const seed = buildEditShareRollSeed(
      safeSlides,
      rollIdForPatch || null,
      reviewIdForPatch,
      {
        priorReviewId: slide.reviewId,
        uploadBatchId: slide.uploadBatchId,
        uploadId: slide.uploadId,
      }
    );
    if (!seed) {
      showToastViaEvent("Could not load roll for editing.");
      return;
    }
    setEditRollSeed(seed);
    setEditRollOpen(true);
  }, [safeSlides, active]);

  if (safeSlides.length === 0) {
    return null;
  }

  const current = safeSlides[active] ?? safeSlides[0];

  const rollMetaPatch = getRollMetadataPatchForRoll(current.reviewId, current.uploadBatchId);

  const name = current.username?.trim() || "Member";
  const profileUserId = current.userId?.trim() ?? "";
  const profileHref = profileUserId ? `/users/${profileUserId}` : null;
  const filmStockName = current.stockCard?.name ?? current.context?.label ?? null;
  const filmStockHref = current.stockCard?.href ?? current.context?.href ?? null;
  const showFilmMetaRow = !!(filmStockName && filmStockHref);
  const filmStockSlugForImages = (
    current.filmStockSlug?.trim() ||
    (filmStockHref?.startsWith("/films/") ? filmStockHref.slice("/films/".length).split(/[/?#]/)[0] ?? "" : "")
  ).trim();
  const filmStockImagesHref = filmStockSlugForImages ? `/images/film/${filmStockSlugForImages}` : null;
  const rollTitleValue = rollMetaPatch
    ? (rollMetaPatch.reviewTitle ?? "").trim()
    : current.rollTitle?.trim() ?? "";
  const cameraValue = rollMetaPatch
    ? (rollMetaPatch.camera ?? "").trim()
    : current.metadata?.camera?.trim() ?? "";
  const lensValue = rollMetaPatch
    ? (rollMetaPatch.lens ?? "").trim()
    : current.metadata?.lens?.trim() ?? "";
  const labValue = rollMetaPatch
    ? (rollMetaPatch.lab ?? "").trim()
    : current.metadata?.lab?.trim() ?? "";
  const scannerValue = rollMetaPatch
    ? (rollMetaPatch.scanner ?? "").trim()
    : current.metadata?.scanner?.trim() ?? "";
  const pushPullValue = current.metadata?.push_pull?.trim() ?? "";
  const locationValue = rollMetaPatch
    ? (rollMetaPatch.location ?? "").trim()
    : (current.location ?? current.metadata?.location)?.trim() ?? "";
  const shotIsoValue = rollMetaPatch
    ? (rollMetaPatch.shot_iso ?? "").trim()
    : current.metadata?.shot_iso?.trim() ?? "";
  const formatValue = rollMetaPatch
    ? (rollMetaPatch.format ?? "").trim()
    : current.metadata?.format?.trim() ?? "";
  const shotDateValue = rollMetaPatch
    ? (rollMetaPatch.shot_date ?? "").trim()
    : current.metadata?.shot_date?.trim() ?? "";
  const tagsValue = rollMetaPatch
    ? (rollMetaPatch.tags ?? "").trim()
    : current.metadata?.tags?.trim() ?? "";
  const hasMetadataTable =
    showFilmMetaRow ||
    !!cameraValue ||
    !!lensValue ||
    !!labValue ||
    !!scannerValue ||
    !!pushPullValue ||
    !!shotIsoValue ||
    !!formatValue ||
    !!tagsValue;
  const shotAtIsoValue = shotIsoValue ? `Shot at ${formatIsoRowValue(shotIsoValue)}` : "";
  const filmStockDetailParts = [formatValue || "", shotAtIsoValue].filter(Boolean);
  const lensIsoFormatParts = showFilmMetaRow
    ? [lensValue || ""].filter(Boolean)
    : [lensValue || "", shotIsoValue ? formatIsoRowValue(shotIsoValue) : "", formatValue || ""].filter(Boolean);
  const labScannerParts = [labValue ? filmLabPublicLabel(labValue) : "", scannerValue || ""].filter(Boolean);
  const captionPlain = rollMetaPatch
    ? (rollMetaPatch.caption?.trim() ? rollMetaPatch.caption.trim() : "")
    : current.caption?.trim()
      ? plainCaptionFull(current.caption)
      : "";
  const shouldShowCaptionMore =
    !captionExpanded && (captionOverflowsFiveLines || captionPlain.length > 180);
  const captionCollapsedText = shouldShowCaptionMore
    ? `${captionPlain.slice(0, 180).trimEnd()}`
    : captionPlain;
  const showCaptionBlock = rollMetaPatch
    ? (rollMetaPatch.caption?.trim()?.length ?? 0) > 0
    : !!current.caption?.trim();
  const captionMetaDate = shotDateValue ? formatShotDateLabel(shotDateValue) : "";
  const captionTagsValue = tagsValue ? formatCaptionTags(tagsValue) : "";
  const showUnderCaptionDetails = !showCaptionBlock || captionExpanded || !shouldShowCaptionMore;
  const showUnderCaptionMeta =
    (!!locationValue || !!captionMetaDate) &&
    showUnderCaptionDetails;
  const showUnderCaptionTags = !!captionTagsValue && showUnderCaptionDetails;

  const comments = current.commentCount ?? null;
  const moreFromRollHeading = rollTitleValue ? `More from ${rollTitleValue}` : "More from this roll";

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
                {canOwnerManageRoll ? (
                  <button
                    type="button"
                    onClick={() => setRollOwnerSheetOpen(true)}
                    className={cn(
                      topRightNavIconButtonClassName,
                      "text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
                    )}
                    aria-label="Roll options"
                    aria-expanded={rollOwnerSheetOpen}
                  >
                    <MoreHorizontal className="size-6 stroke-[1.75]" />
                  </button>
                ) : (
                  <div className="min-h-[44px] min-w-[44px] shrink-0" aria-hidden />
                )}
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
                        className={`h-5 w-5 stroke-[1.5] ${isLiked ? "fill-black text-black dark:fill-white dark:text-white" : ""}`}
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
                <div className="space-y-2">
                  {rollTitleValue ? (
                    <p className="text-sm font-medium leading-relaxed text-neutral-900 break-words dark:text-neutral-100">
                      {rollTitleValue}
                    </p>
                  ) : null}
                  {showCaptionBlock ? (
                    <div className="relative text-sm leading-relaxed">
                      {!captionExpanded ? (
                        <p
                          ref={captionClampedRef}
                          className="whitespace-pre-wrap text-neutral-900 dark:text-neutral-100 break-words"
                        >
                          {captionCollapsedText}
                          {shouldShowCaptionMore ? (
                            <>
                              {" "}
                              <button
                                type="button"
                                onClick={() => setCaptionExpanded(true)}
                                className="text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400"
                              >
                                ... more
                              </button>
                            </>
                          ) : null}
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap text-neutral-900 dark:text-neutral-100 break-words">
                          {captionPlain}
                        </p>
                      )}
                    </div>
                  ) : null}
                  {showUnderCaptionTags ? (
                    <p className="break-words text-[13px] font-medium leading-tight text-muted-foreground">
                      {captionTagsValue}
                    </p>
                  ) : null}
                  {showUnderCaptionMeta ? (
                    <div className="flex min-w-0 items-center gap-1 text-[13px] font-normal text-muted-foreground">
                      {locationValue ? <span className="min-w-0 truncate">{locationValue}</span> : null}
                      {locationValue && captionMetaDate ? <span aria-hidden>|</span> : null}
                      {captionMetaDate ? <span className="min-w-0 truncate">{captionMetaDate}</span> : null}
                    </div>
                  ) : null}
                </div>

                {hasMetadataTable ? (
                  <div className="-mx-4 mt-[22px] flex flex-col">
                    {showFilmMetaRow ? (
                      <Link
                        href={filmStockImagesHref ?? filmStockHref!}
                        onClick={onClose}
                        className={cn(
                          lightboxMetaHairline,
                          "flex min-h-11 items-center px-4 py-2 text-left transition-colors hover:bg-secondary/70 active:bg-secondary dark:hover:bg-secondary/50 dark:active:bg-secondary/70"
                        )}
                      >
                        <div className={lightboxMetaThumbShell}>
                          {current.stockCard?.imageUrl ? (
                            <Image
                              src={current.stockCard.imageUrl}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-contain"
                              quality={82}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted/30">
                              <Camera className="h-4 w-4 text-muted-foreground/40" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="min-w-0 truncate text-[14px] font-medium leading-tight text-neutral-900 dark:text-neutral-100">
                            {filmStockName}
                          </p>
                          {filmStockDetailParts.length > 0 ? (
                            <p className="mt-1 min-w-0 truncate text-[13px] font-normal text-muted-foreground">
                              {filmStockDetailParts.join(" | ")}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    ) : null}
                    {cameraValue ? (
                      <Link
                        href={`/images/camera?name=${encodeURIComponent(cameraValue)}`}
                        onClick={onClose}
                        className={cn(
                          lightboxMetaHairline,
                          "flex min-h-11 items-start px-4 py-2 text-left transition-colors hover:bg-secondary/70 active:bg-secondary dark:hover:bg-secondary/50 dark:active:bg-secondary/70"
                        )}
                      >
                        <div className={lightboxMetaCameraIconColumn}>
                          <Camera className={lightboxMetaLeadingIconClass} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="min-w-0 truncate text-[14px] font-medium leading-tight text-neutral-900 dark:text-neutral-100">
                            {cameraValue}
                          </p>
                          {lensValue ? (
                            <p className="mt-1 min-w-0 truncate text-[13px] font-normal text-muted-foreground">
                              {lensValue}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    ) : null}
                    {labScannerParts.length > 0 ? (
                      <div className={cn(lightboxMetaHairline, "flex min-h-11 items-center px-4 py-2")}>
                        <div className={lightboxMetaThumbShell}>
                          <FlaskConical className={lightboxMetaLeadingIconClass} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="min-w-0 truncate text-[14px] font-medium leading-tight text-neutral-900 dark:text-neutral-100">
                            {labValue ? filmLabPublicLabel(labValue) : scannerValue}
                          </p>
                          {labValue && scannerValue ? (
                            <p className="mt-1 min-w-0 truncate text-[13px] font-normal text-muted-foreground">
                              {scannerValue}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {pushPullValue ? (
                      <div className={cn(lightboxMetaHairline, "flex min-h-11 items-center pl-4 pr-4")}>
                        <Gauge className={cn(lightboxMetaLeadingIconClass, "mr-3")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-muted-foreground">
                          {pushPullValue}
                        </span>
                      </div>
                    ) : null}
                    {lensIsoFormatParts.length > 0 && !cameraValue ? (
                      <div className={cn(lightboxMetaHairline, "flex min-h-11 items-center pl-4 pr-4")}>
                        <Aperture className={cn(lightboxMetaLeadingIconClass, "mr-3")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-normal text-muted-foreground">
                          {lensIsoFormatParts.join(" | ")}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {moreRollItems.length > 0 ? (
                  <div className="space-y-2 pt-6">
                    <h3 className="text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-100">
                      {moreFromRollHeading}
                    </h3>
                    <div className="min-w-0 -mx-4 w-[calc(100%+2rem)]">
                      <FilmNativeMasonryGrid
                        items={moreRollItems}
                        ariaLabel="More from this roll"
                        frameClassName="border-neutral-200 bg-white dark:border-white"
                        preserveImageAspectRatio
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

      <Sheet open={rollOwnerSheetOpen} onOpenChange={(o) => !o && setRollOwnerSheetOpen(false)}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="z-[110]"
          className="z-[110] gap-0 pb-8"
        >
          <SheetTitle className="sr-only">Roll actions</SheetTitle>
          <div className="flex flex-col px-4">
            <button
              type="button"
              onClick={() => void openEditRollFlow()}
              className="w-full py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Edit roll
            </button>
            <button
              type="button"
              onClick={() => {
                setRollOwnerSheetOpen(false);
                const rid = current.reviewId?.trim();
                const bid = current.uploadBatchId?.trim();
                const uid = current.uploadId?.trim();
                if (rid) setDeleteRollTarget({ reviewId: rid });
                else if (bid) setDeleteRollTarget({ uploadBatchId: bid });
                else if (uid) setDeleteRollTarget({ uploadId: uid });
                setRollDeleteSheetOpen(true);
              }}
              className="w-full border-t border-border/50 py-4 text-left text-sm font-medium text-destructive transition-colors hover:text-destructive/90"
            >
              Delete roll
            </button>
            <button
              type="button"
              onClick={() => setRollOwnerSheetOpen(false)}
              className="w-full border-t border-border/50 pt-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={rollDeleteSheetOpen}
        onOpenChange={(o) => {
          if (!o && !deleteRollPending) {
            setRollDeleteSheetOpen(false);
            setDeleteRollTarget(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="z-[110]"
          className="z-[110] gap-0 pb-8"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left text-base font-semibold">Delete your roll?</SheetTitle>
          </SheetHeader>
          <p className="px-4 pb-4 text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex flex-col gap-2 px-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                if (!deleteRollPending) {
                  setRollDeleteSheetOpen(false);
                  setDeleteRollTarget(null);
                }
              }}
              disabled={deleteRollPending}
              className="order-2 rounded-[7px] border border-border/50 bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50 disabled:opacity-50 sm:order-1"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={() => void confirmDeleteOwnRoll()}
              disabled={deleteRollPending}
              className="order-1 rounded-[7px] bg-destructive px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50 sm:order-2"
            >
              {deleteRollPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {editRollOpen && editRollSeed ? (
        <AddReviewModal
          open={editRollOpen}
          onOpenChange={(o) => {
            setEditRollOpen(o);
            if (!o) setEditRollSeed(null);
          }}
          mode="upload"
          stock={editRollModalStock}
          editShareRoll={editRollSeed}
          stackAboveLightbox
          onSubmit={handleEditRollSubmit}
        />
      ) : null}
    </>
  );
}
