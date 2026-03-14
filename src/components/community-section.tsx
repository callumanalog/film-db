"use client";

import { useState, useEffect } from "react";
import { SAMPLE_GALLERY } from "@/lib/sample-images";
import type { FlickrPhoto } from "@/lib/flickr";
import { ReviewsTabContent } from "@/components/reviews-tab-content";
import {
  getUploadsForFilmStock,
  getMyUploadsForFilmStock,
  type FilmUploadRow,
} from "@/app/actions/uploads";
import {
  Camera,
  Film,
  Plus,
  Star,
  StarHalf,
  ThumbsUp,
  Eye,
  ExternalLink,
  CheckCircle2,
  CirclePlus,
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

interface CommunityReview {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  camera?: string;
  likes: number;
  images?: string[];
}

const SAMPLE_REVIEWS: CommunityReview[] = [
  {
    id: "r1",
    username: "nightcrawler_35mm",
    avatar: "NC",
    rating: 5,
    date: "2 days ago",
    text: "The king of night photography film. Shot three rolls in Tokyo at night — the halation around neon signs is absolutely unreal. Nothing else gives you this look. Metered at 800 and got perfect exposures. If you haven't shot this under tungsten light, you're missing out.",
    camera: "Contax G2",
    likes: 47,
  },
  {
    id: "r2",
    username: "analog.sara",
    avatar: "AS",
    rating: 4,
    date: "1 week ago",
    text: "Gorgeous stock but you need to know what you're getting into. The halation is a love-it-or-hate-it thing. Shot a roll at golden hour and the warm tones were beautiful, but the red glow around backlit subjects was a bit much for portraiture. Best reserved for moody urban work. Also — not cheap.",
    camera: "Nikon FM2",
    likes: 32,
  },
  {
    id: "r3",
    username: "filmvault",
    avatar: "FV",
    rating: 5,
    date: "2 weeks ago",
    text: "Pushed this to 1600 for a concert shoot and the results were incredible. Grain is there but it adds character. The colors under mixed lighting are cinematic in a way no digital preset can replicate. This is the stock that got me back into film.",
    camera: "Canon AE-1 Program",
    likes: 89,
  },
  {
    id: "r4",
    username: "grainsofsilver",
    avatar: "GS",
    rating: 3.5,
    date: "3 weeks ago",
    text: "Overhyped? Maybe slightly. It's a great stock but the price-to-roll ratio is brutal. The halation effect is cool but one-note — once you've seen it in neon cityscapes, you've seen it everywhere. I prefer Portra 800 for general high-speed color work. That said, I keep coming back to 800T for specific projects.",
    camera: "Leica M6",
    likes: 24,
  },
  {
    id: "r5",
    username: "shutterdiaries",
    avatar: "SD",
    rating: 4.5,
    date: "1 month ago",
    text: "Shot my entire wedding reception on this and the couple was blown away. The warm ambient light rendered beautifully neutral, and the halation around candles added magic I couldn't have planned. Expensive for a wedding, but absolutely worth it for the reception/evening portion.",
    camera: "Pentax 67",
    likes: 61,
  },
];

function MiniStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const adjusted = rating - full >= 0.75 ? full + 1 : full;
  const empty = 5 - adjusted - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center">
      {Array.from({ length: adjusted }).map((_, i) => (
        <Star key={`f-${i}`} className="text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
      ))}
      {hasHalf && (
        <div className="relative" style={{ width: size, height: size }}>
          <Star className="absolute text-amber-400/30" style={{ width: size, height: size }} />
          <StarHalf className="absolute text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
        </div>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="text-amber-400/30" style={{ width: size, height: size }} />
      ))}
    </div>
  );
}

export function QuickActions() {
  const [saved, setSaved] = useState(false);
  const [tracked, setTracked] = useState(false);
  const [shotIt, setShotIt] = useState(false);

  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        onClick={() => setShotIt(!shotIt)}
        className={`group inline-flex items-center gap-2 rounded-[7px] border px-4 py-2 text-sm font-semibold transition-all ${
          shotIt
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
            : "border-border bg-card text-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5"
        }`}
      >
        <CheckCircle2 className={`h-4 w-4 transition-colors ${shotIt ? "text-emerald-500 fill-emerald-500" : "text-muted-foreground group-hover:text-emerald-500"}`} />
        {shotIt ? "Shot It" : "Shot It"}
      </button>

      <button
        onClick={() => setTracked(!tracked)}
        className={`group inline-flex items-center gap-2 rounded-[7px] border px-4 py-2 text-sm font-semibold transition-all ${
          tracked
            ? "border-blue-500/40 bg-blue-500/10 text-blue-600"
            : "border-border bg-card text-foreground hover:border-blue-500/30 hover:bg-blue-500/5"
        }`}
      >
        <Film className={`h-4 w-4 transition-colors ${tracked ? "text-blue-500" : "text-muted-foreground group-hover:text-blue-500"}`} />
        {tracked ? "Tracked" : "Track"}
      </button>

      <button
        onClick={() => setSaved(!saved)}
        className={`group inline-flex items-center gap-2 rounded-[7px] border px-4 py-2 text-sm font-semibold transition-all ${
          saved
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
        }`}
      >
        {saved ? (
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary" aria-hidden>
            <Plus className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </span>
        ) : (
          <CirclePlus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        )}
        {saved ? "On Shootlist" : "Shootlist"}
      </button>
    </div>
  );
}

interface CommunitySectionProps {
  stockName: string;
}

/* ─── Community Notes (standalone export for tab use) ─── */

export function CommunityReviews({ slug }: { slug?: string }) {
  return <ReviewsTabContent slug={slug} />;
}

/* ─── References (Flickr-tagged + from reviews; standalone export for tab use) ─── */

/** Strip aperture (e.g. " f/2", " f/1.4") from camera string for display. */
function cameraWithoutAperture(camera: string): string {
  return camera.replace(/\s+f\/[\d.]+$/i, "").trim() || camera;
}

const EXAMPLE_TAB_PLACEHOLDERS: { src: string; username: string; camera: string; likes: number }[] = [
  { src: "/placeholders/placeholder-1.png", username: "nightcrawler_35mm", camera: "Contax G2 · 45mm", likes: 0 },
  { src: "/placeholders/placeholder-2.png", username: "analog.sara", camera: "Nikon FM2 · 50mm", likes: 0 },
  { src: "/placeholders/placeholder-3.png", username: "filmvault", camera: "Canon AE-1 · 50mm", likes: 0 },
  { src: "/placeholders/placeholder-4.png", username: "tokyoframes", camera: "Olympus OM-1 · 28mm", likes: 0 },
];

/** 50 placeholder cards for Flickr toggle on Gallery tab — same styling as other image cards. */
const FLICKR_TAB_PLACEHOLDERS: { id: string; src: string; username: string; camera: string; likes: number }[] = Array.from(
  { length: 50 },
  (_, i) => {
    const placeholders = [
      { src: "/placeholders/placeholder-1.png", username: "nightcrawler_35mm", camera: "Contax G2 · 45mm" },
      { src: "/placeholders/placeholder-2.png", username: "analog.sara", camera: "Nikon FM2 · 50mm" },
      { src: "/placeholders/placeholder-3.png", username: "filmvault", camera: "Canon AE-1 · 50mm" },
      { src: "/placeholders/placeholder-4.png", username: "tokyoframes", camera: "Olympus OM-1 · 28mm" },
    ];
    const p = placeholders[i % 4];
    return { id: `flickr-placeholder-${i + 1}`, src: p.src, username: p.username, camera: p.camera, likes: Math.floor((i * 7) % 50) };
  }
);

type GalleryView = "flickr" | "community" | "you";

/** Initials for avatar (e.g. "analog.sara" → "AS", "You" → "YO"). */
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

/** Lightbox: image left, details panel right. Shows real metadata when from user upload. */
function GalleryLightbox({
  imageUrl,
  alt = "",
  caption,
  username = "filumbycallum",
  metadata,
  onClose,
}: {
  imageUrl: string;
  alt?: string;
  caption?: string | null;
  username?: string;
  metadata?: {
    camera?: string | null;
    shot_iso?: string | null;
    lens?: string | null;
    lab?: string | null;
    filter?: string | null;
    scanner?: string | null;
    push_pull?: string | null;
  };
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Image detail"
    >
      {/* Left: image */}
      <div
        className="relative flex min-w-0 flex-1 items-center justify-center bg-black p-4"
        role="presentation"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <div
          className="relative flex max-h-full max-w-full items-center justify-center"
          role="presentation"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            className="max-h-[85vh] w-auto max-w-full object-contain"
          />
        </div>
        {/* Pagination dots (mock) */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === 1 ? "bg-white" : "bg-white/40"}`}
              aria-hidden
            />
          ))}
        </div>
        <span className="absolute bottom-6 right-6 text-white/60" aria-hidden>
          <ChevronRight className="h-8 w-8" />
        </span>
      </div>

      {/* Right: details panel (mock) */}
      <div className="flex w-full max-w-[420px] flex-col border-l border-border/20 bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{username}</p>
          </div>
        </div>

        {/* Caption & metadata */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {caption ? (
            <p className="text-sm">
              <span className="rounded bg-primary/10 px-1 font-semibold text-primary">{username}</span>{" "}
              {caption}
            </p>
          ) : null}
          {metadata && (metadata.camera || metadata.shot_iso || metadata.lens || metadata.lab || metadata.filter || metadata.scanner || metadata.push_pull) ? (
            <dl className="mt-3 space-y-2 border-t border-border/40 pt-3">
              {metadata.camera ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Camera</dt>
                  <dd className="text-sm">{metadata.camera}</dd>
                </div>
              ) : null}
              {metadata.shot_iso ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Shot at ISO</dt>
                  <dd className="text-sm">{metadata.shot_iso}</dd>
                </div>
              ) : null}
              {metadata.lens ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Lens</dt>
                  <dd className="text-sm">{metadata.lens}</dd>
                </div>
              ) : null}
              {metadata.lab ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Lab / Processing</dt>
                  <dd className="text-sm">{metadata.lab}</dd>
                </div>
              ) : null}
              {metadata.push_pull ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Push/Pull</dt>
                  <dd className="text-sm">{metadata.push_pull}</dd>
                </div>
              ) : null}
              {metadata.filter ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Filter</dt>
                  <dd className="text-sm">{metadata.filter}</dd>
                </div>
              ) : null}
              {metadata.scanner ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Scanner</dt>
                  <dd className="text-sm">{metadata.scanner}</dd>
                </div>
              ) : null}
            </dl>
          ) : caption ? null : (
            <p className="text-sm text-muted-foreground">No details for this shot.</p>
          )}
        </div>

      </div>
    </div>
  );
}

const GALLERY_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
];

export function CommunityGallery({
  stockName,
  slug,
  flickrImages = [],
  variant,
}: {
  stockName: string;
  slug?: string;
  flickrImages?: FlickrPhoto[];
  /** When "tab", show the Gallery tab header (Flickr | Community | You + count + sort). */
  variant?: "tab";
}) {
  const useFlickr = flickrImages.length > 0;
  const [view, setView] = useState<GalleryView>(useFlickr ? "flickr" : "community");
  const [sort, setSort] = useState<string>("newest");
  const [communityUploads, setCommunityUploads] = useState<FilmUploadRow[]>([]);
  const [myUploads, setMyUploads] = useState<FilmUploadRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(!!slug);
  const [lightboxImage, setLightboxImage] = useState<{
    imageUrl: string;
    alt?: string;
    caption?: string | null;
    username?: string;
    metadata?: {
      camera?: string | null;
      shot_iso?: string | null;
      lens?: string | null;
      lab?: string | null;
      filter?: string | null;
      scanner?: string | null;
      push_pull?: string | null;
    };
  } | null>(null);

  useEffect(() => {
    if (!slug) {
      setCommunityUploads([]);
      setMyUploads([]);
      setGalleryLoading(false);
      return;
    }
    setGalleryLoading(true);
    Promise.all([getUploadsForFilmStock(slug), getMyUploadsForFilmStock(slug)])
      .then(([community, my]) => {
        setCommunityUploads(community);
        setMyUploads(my);
      })
      .finally(() => setGalleryLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const handler = (e: CustomEvent<{ slug: string }>) => {
      if (e.detail?.slug === slug) {
        setGalleryLoading(true);
        Promise.all([getUploadsForFilmStock(slug), getMyUploadsForFilmStock(slug)])
          .then(([community, my]) => {
            setCommunityUploads(community);
            setMyUploads(my);
          })
          .finally(() => setGalleryLoading(false));
      }
    };
    window.addEventListener("film-upload-complete", handler as EventListener);
    return () => window.removeEventListener("film-upload-complete", handler as EventListener);
  }, [slug]);

  const isTab = variant === "tab";
  const communityItemsCount = slug ? communityUploads.length : EXAMPLE_TAB_PLACEHOLDERS.length + SAMPLE_GALLERY.length;
  const flickrCount = isTab ? FLICKR_TAB_PLACEHOLDERS.length : flickrImages.length;
  const yourImagesCount = slug
    ? myUploads.length
    : EXAMPLE_TAB_PLACEHOLDERS.filter((p) => p.username === "nightcrawler_35mm").length
      + SAMPLE_GALLERY.filter((s) => s.username === "nightcrawler_35mm").length;
  const displayTotal = view === "flickr" ? flickrCount : view === "community" ? communityItemsCount : yourImagesCount;
  const displayStart = displayTotal === 0 ? 0 : 1;
  const displayEnd = displayTotal;

  return (
    <div className="space-y-6">
      {isTab && (
        <>
          <div
            className="inline-flex rounded-card border border-border/60 bg-secondary/30 p-0.5"
            role="tablist"
            aria-label="Image source"
          >
            {(["flickr", "community", "you"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-card px-4 py-2 text-sm font-medium transition-colors ${
                  view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "flickr" ? "Flickr" : v === "community" ? "Community" : "You"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {galleryLoading ? "Loading…" : displayTotal === 0 ? "No images yet" : `Showing ${displayStart}–${displayEnd} of ${displayTotal} images`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort by:</span>
              <Select value={sort} onValueChange={(v) => setSort(v ?? "newest")}>
                <SelectTrigger className="w-[140px]" size="sm">
                  <span>{GALLERY_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest"}</span>
                </SelectTrigger>
                <SelectContent>
                  {GALLERY_SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {!isTab && (
        <p className="text-sm text-muted-foreground">
          Photos tagged with this film on Flickr and from community reviews.
        </p>
      )}

      {isTab && view === "you" && yourImagesCount === 0 && !galleryLoading ? (
        <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">You haven't added any images yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Your uploads will appear here.</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add image
          </button>
        </div>
      ) : galleryLoading ? (
        <div className="rounded-[7px] border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
          Loading images…
        </div>
      ) : (
      <div className="columns-2 gap-1.5 md:columns-3 lg:columns-3">
        {(() => {
          const showFlickrOnly = isTab && view === "flickr";
          const showCommunity = !isTab || view === "community";
          const showYouOnly = isTab && view === "you";
          const useRealUploads = !!slug;
          const placeholdersToShow = useRealUploads
            ? []
            : showYouOnly
              ? EXAMPLE_TAB_PLACEHOLDERS.filter((p) => p.username === "nightcrawler_35mm")
              : showCommunity
                ? [...EXAMPLE_TAB_PLACEHOLDERS]
                : [];
          /** When tab + Flickr view: 50 placeholder cards; otherwise real flickr when community has flickr. */
          const flickrToShow = showFlickrOnly
            ? FLICKR_TAB_PLACEHOLDERS
            : (showCommunity && useFlickr) ? flickrImages : [];
          const sampleToShow = useRealUploads
            ? []
            : showYouOnly
              ? SAMPLE_GALLERY.filter((s) => s.username === "nightcrawler_35mm")
              : showCommunity && !useFlickr
                ? SAMPLE_GALLERY
                : [];
          const communityUploadsToShow = useRealUploads && showCommunity ? communityUploads : [];
          const myUploadsToShow = useRealUploads && showYouOnly ? myUploads : [];

          return (
            <>
        {/* Real community uploads (when slug and Community tab) */}
        {communityUploadsToShow.map((u) => {
          const displayName = u.display_name ?? "Member";
          return (
          <button
            type="button"
            key={u.id}
            onClick={() => u.image_url && setLightboxImage({ imageUrl: u.image_url!, alt: u.caption ?? "", caption: u.caption, username: u.display_name ?? undefined, metadata: { camera: u.camera, shot_iso: u.shot_iso, lens: u.lens, lab: u.lab, filter: u.filter, scanner: u.scanner, push_pull: u.push_pull } })}
            className="group block w-full cursor-pointer break-inside-avoid mb-1.5 text-left overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
          >
            {u.image_url ? (
              <div className="relative block w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.image_url}
                  alt={u.caption ?? ""}
                  className="block w-full h-auto"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none"
                  aria-hidden
                />
                <p className="absolute bottom-2 left-2 right-20 text-xs font-medium text-white drop-shadow-sm truncate">
                  {displayName}
                </p>
                <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50" aria-label="Like">
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50" aria-label="Save">
                    <Bookmark className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </button>
          );
        })}
        {/* Real user uploads (when slug and You tab) */}
        {myUploadsToShow.map((u) => (
          <button
            type="button"
            key={u.id}
            onClick={() => u.image_url && setLightboxImage({ imageUrl: u.image_url!, alt: u.caption ?? "", caption: u.caption, username: "You", metadata: { camera: u.camera, shot_iso: u.shot_iso, lens: u.lens, lab: u.lab, filter: u.filter, scanner: u.scanner, push_pull: u.push_pull } })}
            className="group block w-full cursor-pointer break-inside-avoid mb-1.5 text-left overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
          >
            {u.image_url ? (
              <div className="relative block w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.image_url}
                  alt={u.caption ?? ""}
                  className="block w-full h-auto"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none"
                  aria-hidden
                />
                <p className="absolute bottom-2 left-2 right-20 text-xs font-medium text-white drop-shadow-sm truncate">
                  You
                </p>
                <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50" aria-label="Like">
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50" aria-label="Save">
                    <Bookmark className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </button>
        ))}
        {/* Placeholder cards (when no slug) */}
        {placeholdersToShow.map((item, i) => {
          const cardId = `placeholder-${i}`;
          return (
          <button
            key={cardId}
            type="button"
            onClick={() => setLightboxImage({ imageUrl: item.src, username: item.username })}
            className="group block w-full cursor-pointer break-inside-avoid mb-1.5 text-left overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt=""
              className="block w-full h-auto"
              aria-hidden
            />
            <div className="flex items-center gap-2 p-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground" aria-hidden>
                {getInitials(item.username)}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-medium">{item.username}</p>
              <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Like">
                  <Heart className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Save">
                  <Bookmark className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          </button>
          );
        })}
        {/* Flickr: 50 placeholder cards (tab) or real Flickr images */}
        {flickrToShow.length > 0 &&
          (showFlickrOnly ? (
            FLICKR_TAB_PLACEHOLDERS.map((item) => {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxImage({ imageUrl: item.src, username: item.username })}
                  className="group block w-full cursor-pointer break-inside-avoid mb-1.5 text-left overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt="" className="block w-full h-auto" aria-hidden />
                  <div className="flex items-center gap-2 p-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground" aria-hidden>
                      {getInitials(item.username)}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-xs font-medium">{item.username}</p>
                    <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Like">
                        <Heart className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Save">
                        <Bookmark className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
          flickrToShow.map((item) => {
              const img = item as FlickrPhoto;
              return (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxImage({ imageUrl: img.imageUrl, alt: img.title || "", username: img.ownerName })}
                className="group block w-full cursor-pointer break-inside-avoid mb-1.5 text-left overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt={img.title || ""}
                  className="block w-full h-auto"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="flex items-center gap-2 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground" aria-hidden>
                    {getInitials(img.ownerName)}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-xs font-medium">{img.ownerName}</p>
                  <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Like">
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Save">
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              </button>
              );
            })
          )
          )}
        {sampleToShow.length > 0 &&
          sampleToShow.map((img) => {
              return (
              <button
                key={img.id}
                type="button"
                onClick={() => img.imageUrl && setLightboxImage({ imageUrl: img.imageUrl!, username: img.username })}
                className="group block w-full cursor-pointer break-inside-avoid mb-1.5 text-left overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
              >
                {img.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="block w-full h-auto"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-red-900/40">
                    <Camera className="h-8 w-8 text-white/20" />
                  </div>
                )}
                <div className="flex items-center gap-2 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground" aria-hidden>
                    {getInitials(img.username)}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-xs font-medium">{img.username}</p>
                  <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Like">
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={(e) => e.stopPropagation()} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Save">
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              </button>
              );
            })}
            </>
          );
        })()}
      </div>
      )}

      {useFlickr && (
        <p className="text-center text-[10px] text-muted-foreground/80">
          This product uses the Flickr API but is not endorsed or certified by SmugMug, Inc.
        </p>
      )}

      {lightboxImage && (
        <GalleryLightbox
          imageUrl={lightboxImage.imageUrl}
          alt={lightboxImage.alt ?? ""}
          caption={lightboxImage.caption}
          username={lightboxImage.username}
          metadata={lightboxImage.metadata}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

/* ─── Legacy wrapper (kept for non-cinestill pages) ─── */

export function CommunitySection({ stockName }: CommunitySectionProps) {
  return (
    <div className="space-y-10">
      <CommunityReviews />
      <CommunityGallery stockName={stockName} />
    </div>
  );
}
