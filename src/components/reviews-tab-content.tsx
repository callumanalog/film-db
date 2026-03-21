"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Star,
  StarHalf,
  Camera,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  getReviewsForFilmStock,
  getMyReviewsForFilmStock,
  type FilmReviewRow,
} from "@/app/actions/reviews";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type ReviewView = "everyone" | "you";

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
];

const REVIEWS_PER_PAGE = 50;
const TEXT_PREVIEW_LENGTH = 220;

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week(s) ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function MiniStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const adjusted = rating - full >= 0.75 ? full + 1 : full;
  const empty = 5 - adjusted - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: adjusted }).map((_, i) => (
        <Star key={`f-${i}`} className="text-primary fill-primary" style={{ width: size, height: size }} />
      ))}
      {hasHalf && (
        <div className="relative" style={{ width: size, height: size }}>
          <Star className="absolute text-primary/30" style={{ width: size, height: size }} />
          <StarHalf className="absolute text-primary fill-primary" style={{ width: size, height: size }} />
        </div>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="text-primary/30" style={{ width: size, height: size }} />
      ))}
    </div>
  );
}

export function ReviewCard({
  review,
  displayName,
  isYou,
  expandedTextIds,
  onToggleText,
}: {
  review: FilmReviewRow;
  displayName: string;
  isYou: boolean;
  expandedTextIds: Set<string>;
  onToggleText: (id: string) => void;
}) {
  const textExpanded = expandedTextIds.has(review.id);
  const text = review.review_text ?? "";
  const previewText =
    text.length <= TEXT_PREVIEW_LENGTH ? text : text.slice(0, TEXT_PREVIEW_LENGTH).trim() + "…";
  const showMoreText = text.length > TEXT_PREVIEW_LENGTH;
  const displayText = textExpanded ? text : previewText;
  const rating = review.rating != null && review.rating > 0 ? Number(review.rating) : 0;

  return (
    <article className="rounded-[7px] border border-border/50 bg-card overflow-hidden transition-colors hover:border-border">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {isYou ? "You" : (displayName || "Member").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Review by{" "}
                <span className="font-medium text-foreground">
                  {isYou ? "You" : displayName || "Member"}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                {rating > 0 && <MiniStars rating={rating} size={14} />}
                {rating > 0 && <span className="text-muted-foreground/60">·</span>}
                <span className="text-xs text-muted-foreground">
                  {formatReviewDate(review.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {review.camera && (
              <div className="hidden items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 sm:flex">
                <Camera className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{review.camera}</span>
              </div>
            )}
            <button
              type="button"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {review.review_title && (
          <p className="mt-3 text-[13px] font-medium italic text-foreground">
            {review.review_title}
          </p>
        )}

        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {displayText}
          {showMoreText && (
            <button
              type="button"
              onClick={() => onToggleText(review.id)}
              className="ml-1 font-medium text-primary hover:underline"
            >
              {textExpanded ? " Show less" : " More"}
            </button>
          )}
        </p>
      </div>
    </article>
  );
}

export function ReviewsTabContent({ slug }: { slug?: string }) {
  const [view, setView] = useState<ReviewView>("everyone");
  const [sort, setSort] = useState<string>("newest");
  const [reviews, setReviews] = useState<FilmReviewRow[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [expandedTextIds, setExpandedTextIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!slug) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetcher = view === "you" ? getMyReviewsForFilmStock(slug) : getReviewsForFilmStock(slug);
    fetcher
      .then((data) => {
        setReviews(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, view]);

  const sortedReviews = useMemo(() => {
    if (sort === "newest") return [...reviews];
    return [...reviews].sort((a, b) => {
      const ra = a.rating != null ? Number(a.rating) : 0;
      const rb = b.rating != null ? Number(b.rating) : 0;
      return rb - ra;
    });
  }, [reviews, sort]);

  const totalCount = sortedReviews.length;
  const paginatedReviews =
    view === "you"
      ? sortedReviews
      : sortedReviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(totalCount / REVIEWS_PER_PAGE));
  const displayTotal = totalCount;
  const start = totalCount === 0 ? 0 : (page - 1) * REVIEWS_PER_PAGE + 1;
  const end = Math.min(page * REVIEWS_PER_PAGE, totalCount);

  function toggleText(id: string) {
    setExpandedTextIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!slug) {
    return (
      <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">Select a film to see reviews.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Long scroll: list of review cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-[7px] border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
            Loading reviews…
          </div>
        ) : view === "you" && paginatedReviews.length === 0 ? (
          <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">You haven’t reviewed this film yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add shooting notes to see them here.</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Shooting Notes
            </button>
          </div>
        ) : (
          paginatedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              displayName={review.display_name ?? "Member"}
              isYou={view === "you"}
              expandedTextIds={expandedTextIds}
              onToggleText={toggleText}
            />
          ))
        )}
      </div>

      {/* Pagination — only when viewing Everyone and more than one page */}
      {!loading && totalPages > 1 && view === "everyone" && (
        <div className="flex items-center justify-center gap-2 border-t border-border/50 pt-8">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-card border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 rounded-card border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
