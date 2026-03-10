"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_GALLERY } from "@/lib/sample-images";
import type { FlickrPhoto } from "@/lib/flickr";
import {
  Camera,
  Heart,
  CheckCircle2,
  Plus,
  Star,
  StarHalf,
  ThumbsUp,
  Eye,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

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
  const [shootlisted, setShootlisted] = useState(false);
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
        onClick={() => setShootlisted(!shootlisted)}
        className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
          shootlisted
            ? "border-blue-500/40 bg-blue-500/10 text-blue-600"
            : "border-border bg-card text-foreground hover:border-blue-500/30 hover:bg-blue-500/5"
        }`}
      >
        <Eye className={`h-4 w-4 transition-colors ${shootlisted ? "text-blue-500" : "text-muted-foreground group-hover:text-blue-500"}`} />
        {shootlisted ? "On Shootlist" : "Add to Shootlist"}
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
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  const visibleReviews = showAllReviews ? SAMPLE_REVIEWS : SAMPLE_REVIEWS.slice(0, 3);

  function toggleLike(id: string) {
    setLikedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header + Add a Note */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Community Notes</h2>
        <button className="font-advercase inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add a Note
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Tips and advice for shooting this stock — how to get the best results, what to watch for, and what worked for others. You can rate it too if you like.
      </p>

      {/* Individual Notes */}
      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {review.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{review.username}</p>
                  <div className="flex items-center gap-2">
                    <MiniStars rating={review.rating} size={12} />
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                </div>
              </div>
              {review.camera && (
                <div className="hidden items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 sm:flex">
                  <Camera className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{review.camera}</span>
                </div>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {review.text}
            </p>

            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => toggleLike(review.id)}
                className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
                  likedReviews.has(review.id)
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${likedReviews.has(review.id) ? "fill-primary" : ""}`} />
                {review.likes + (likedReviews.has(review.id) ? 1 : 0)}
              </button>
            </div>
          </div>
        ))}
      </div>

      {SAMPLE_REVIEWS.length > 3 && (
        <button
          onClick={() => setShowAllReviews(!showAllReviews)}
          className="font-advercase flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-card py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {showAllReviews ? (
            <>Show Less <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Show All {SAMPLE_REVIEWS.length} Notes <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  );
}

/* ─── References (Flickr-tagged + from reviews; standalone export for tab use) ─── */

export function CommunityGallery({
  stockName,
  slug,
  flickrImages = [],
}: {
  stockName: string;
  slug?: string;
  flickrImages?: FlickrPhoto[];
}) {
  const useFlickr = flickrImages.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Sample Images</h2>
        <button className="font-advercase inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Upload your own
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Photos tagged with this film on Flickr and from community reviews.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-6">
        {useFlickr
          ? flickrImages.map((img) => (
              <a
                key={img.id}
                href={img.flickrPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl border border-border/50 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.title || ""}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </div>
                <div className="p-3">
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
              </a>
            ))
          : SAMPLE_GALLERY.map((img) => (
              <div
                key={img.id}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border/50 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-red-900/40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white/20" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                      {img.settings}
                    </span>
                    <div className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5">
                      <Heart className="h-3 w-3 text-white" />
                      <span className="text-[10px] font-medium text-white">{img.likes}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium">{img.username}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{img.camera}</p>
                </div>
              </div>
            ))}
      </div>

      {slug && (
        <div className="flex justify-center pt-2">
          <Link
            href={`/references?stock=${encodeURIComponent(slug)}`}
            className="font-advercase inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:border-primary/30"
          >
            View all references
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        References are sourced from Flickr and community reviews.
      </p>
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
