"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_GALLERY } from "@/lib/sample-images";
import type { FlickrPhoto } from "@/lib/flickr";
import { ReviewsTabContent } from "@/components/reviews-tab-content";
import {
  Camera,
  Heart,
  CheckCircle2,
  Plus,
  Star,
  StarHalf,
  ThumbsUp,
  Eye,
  ExternalLink,
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
        className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
          shotIt
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
            : "border-border bg-card text-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5"
        }`}
      >
        <CheckCircle2 className={`h-4 w-4 transition-colors ${shotIt ? "text-emerald-500" : "text-muted-foreground group-hover:text-emerald-500"}`} />
        {shotIt ? "Shot It" : "I've Shot This"}
      </button>

      <button
        onClick={() => setTracked(!tracked)}
        className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
          tracked
            ? "border-blue-500/40 bg-blue-500/10 text-blue-600"
            : "border-border bg-card text-foreground hover:border-blue-500/30 hover:bg-blue-500/5"
        }`}
      >
        <Plus className={`h-4 w-4 transition-colors ${tracked ? "text-blue-500" : "text-muted-foreground group-hover:text-blue-500"}`} />
        {tracked ? "Tracked" : "Track"}
      </button>

      <button
        onClick={() => setSaved(!saved)}
        className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
          saved
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
        }`}
      >
        <Heart className={`h-4 w-4 transition-all ${saved ? "text-primary fill-primary" : "text-muted-foreground group-hover:text-primary"}`} />
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

interface CommunitySectionProps {
  stockName: string;
}

/* ─── Community Notes (standalone export for tab use) ─── */

export function CommunityReviews() {
  return <ReviewsTabContent />;
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

/** 50 placeholder cards for Flickr toggle on Example images tab — same styling as other image cards. */
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
  /** When "tab", show the Example images tab header (Flickr | Community | You + count + sort). */
  variant?: "tab";
}) {
  const useFlickr = flickrImages.length > 0;
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<GalleryView>(useFlickr ? "flickr" : "community");
  const [sort, setSort] = useState<string>("newest");

  const isTab = variant === "tab";
  const communityItemsCount = EXAMPLE_TAB_PLACEHOLDERS.length + SAMPLE_GALLERY.length;
  const flickrCount = isTab ? FLICKR_TAB_PLACEHOLDERS.length : flickrImages.length;
  const yourImagesCount = EXAMPLE_TAB_PLACEHOLDERS.filter((p) => p.username === "nightcrawler_35mm").length
    + SAMPLE_GALLERY.filter((s) => s.username === "nightcrawler_35mm").length;
  const displayTotal = view === "flickr" ? flickrCount : view === "community" ? communityItemsCount : yourImagesCount;
  const displayStart = displayTotal === 0 ? 0 : 1;
  const displayEnd = displayTotal;

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {isTab && (
        <>
          <div
            className="inline-flex rounded-lg border border-border/60 bg-secondary/30 p-0.5"
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
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "flickr" ? "Flickr" : v === "community" ? "Community" : "You"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {displayTotal === 0 ? "No images yet" : `Showing ${displayStart}–${displayEnd} of ${displayTotal} images`}
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

      {isTab && view === "you" && yourImagesCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">You haven’t added any images yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Your uploads will appear here.</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add image
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-6">
        {(() => {
          const showFlickrOnly = isTab && view === "flickr";
          const showCommunity = !isTab || view === "community";
          const showYouOnly = isTab && view === "you";
          const placeholdersToShow = showYouOnly
            ? EXAMPLE_TAB_PLACEHOLDERS.filter((p) => p.username === "nightcrawler_35mm")
            : showCommunity ? [...EXAMPLE_TAB_PLACEHOLDERS] : [];
          /** When tab + Flickr view: 50 placeholder cards; otherwise real flickr when community has flickr. */
          const flickrToShow = showFlickrOnly
            ? FLICKR_TAB_PLACEHOLDERS
            : (showCommunity && useFlickr) ? flickrImages : [];
          const sampleToShow = showYouOnly
            ? SAMPLE_GALLERY.filter((s) => s.username === "nightcrawler_35mm")
            : showCommunity && !useFlickr ? SAMPLE_GALLERY : [];

          return (
            <>
        {/* Placeholder cards */}
        {placeholdersToShow.map((item, i) => {
          const cardId = `placeholder-${i}`;
          const liked = likedIds.has(cardId);
          const displayCount = item.likes + (liked ? 1 : 0);
          return (
          <div
            key={cardId}
            className="group overflow-hidden rounded-xl border border-border/50 transition-all hover:border-primary/30"
          >
            <div className="relative aspect-[4/3] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="h-full w-full object-cover"
                aria-hidden
              />
            </div>
            <div className="relative flex items-start justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{item.username}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.camera}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleLike(cardId)}
                className="flex shrink-0 items-center gap-1.5 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label={`Like (${displayCount})`}
              >
                <Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : ""}`} />
                <span className="text-sm font-medium tabular-nums">{displayCount}</span>
              </button>
            </div>
          </div>
          );
        })}
        {/* Flickr: 50 placeholder cards (tab) or real Flickr images */}
        {flickrToShow.length > 0 &&
          (showFlickrOnly ? (
            FLICKR_TAB_PLACEHOLDERS.map((item) => {
              const liked = likedIds.has(item.id);
              const displayCount = item.likes + (liked ? 1 : 0);
              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-border/50 transition-all hover:border-primary/30"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.src} alt="" className="h-full w-full object-cover" aria-hidden />
                  </div>
                  <div className="relative flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{item.username}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{item.camera}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLike(item.id)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      aria-label={`Like (${displayCount})`}
                    >
                      <Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : ""}`} />
                      <span className="text-sm font-medium tabular-nums">{displayCount}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
          flickrToShow.map((item) => {
              const img = item as FlickrPhoto;
              const liked = likedIds.has(img.id);
              const displayCount = 0 + (liked ? 1 : 0);
              return (
              <a
                key={img.id}
                href={img.flickrPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl border border-border/50 transition-all hover:border-primary/30"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.title || ""}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="relative flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium line-clamp-1">{img.title || "Untitled"}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      By{" "}
                      <a
                        href={img.ownerProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline decoration-primary/50 underline-offset-2 hover:no-underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {img.ownerName}
                      </a>
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      View on Flickr
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(img.id); }}
                    className="flex shrink-0 items-center gap-1.5 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={`Like (${displayCount})`}
                  >
                    <Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : ""}`} />
                    <span className="text-sm font-medium tabular-nums">{displayCount}</span>
                  </button>
                </div>
              </a>
              );
            })
          )
          )}
        {sampleToShow.length > 0 &&
          sampleToShow.map((img) => {
              const liked = likedIds.has(img.id);
              const displayCount = img.likes + (liked ? 1 : 0);
              return (
              <div
                key={img.id}
                className="group overflow-hidden rounded-xl border border-border/50 transition-all hover:border-primary/30"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {img.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      sizes="(max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-red-900/40">
                      <Camera className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="relative flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{img.username}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{cameraWithoutAperture(img.camera)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleLike(img.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={`Like (${displayCount})`}
                  >
                    <Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : ""}`} />
                    <span className="text-sm font-medium tabular-nums">{displayCount}</span>
                  </button>
                </div>
              </div>
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
