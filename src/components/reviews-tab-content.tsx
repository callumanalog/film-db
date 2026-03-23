"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import {
  Star,
  StarHalf,
  Camera,
  Heart,
  Lightbulb,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  getReviewsForFilmStock,
  getMyReviewsForFilmStock,
  getFollowingReviewsForFilmStock,
  type FilmReviewRow,
} from "@/app/actions/reviews";
import { BEST_FOR_LABELS, type BestFor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { showToastViaEvent } from "@/components/toast";
import { SegmentedViewTabs, type SegmentedView } from "@/components/segmented-view-tabs";

const ALLOWED_TAGS = ["p", "strong", "em", "s", "blockquote", "a", "br"];
const ALLOWED_ATTR = ["href", "target", "rel", "class"];

function sanitizeReviewHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

type ReviewView = SegmentedView;

const REVIEWS_PER_PAGE = 30;
const TEXT_PREVIEW_LENGTH = 220;

/** Two-letter avatar initials from display name (same idea as community gallery). */
function reviewAuthorInitials(displayName: string): string {
  const name = displayName.trim() || "Member";
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
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
  expandedTextIds,
  onToggleText,
  currentUserId,
  onLikeUpdated,
}: {
  review: FilmReviewRow;
  displayName: string;
  expandedTextIds: Set<string>;
  onToggleText: (id: string) => void;
  currentUserId: string | null;
  onLikeUpdated: (reviewId: string, liked: boolean, likeCount: number) => void;
}) {
  const [likePending, setLikePending] = useState(false);
  const textExpanded = expandedTextIds.has(review.id);
  const rawText = review.review_text ?? "";
  const isHtml = /<[a-z][\s\S]*>/i.test(rawText);

  const plainText = isHtml
    ? rawText.replace(/<[^>]*>/g, "").trim()
    : rawText;
  const showMoreText = plainText.length > TEXT_PREVIEW_LENGTH;
  const rating = review.rating != null && review.rating > 0 ? Number(review.rating) : 0;
  const bestForTags = review.best_for ?? [];
  const visibleBestFor = bestForTags.slice(0, 3);
  const hasMoreBestFor = bestForTags.length > 3;

  return (
    <article className="py-5 first:pt-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {reviewAuthorInitials(displayName)}
          </div>
          <span className="text-xs font-medium text-foreground">
            {displayName || "Member"}
          </span>
        </div>
        <button
          type="button"
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {rating > 0 && (
        <div className="mt-3">
          <MiniStars rating={rating} size={16} />
        </div>
      )}

      {isHtml ? (
        <div className="mt-2 text-sm leading-relaxed text-foreground/80">
          {(!showMoreText || textExpanded) ? (
            <div
              className="review-html"
              dangerouslySetInnerHTML={{ __html: sanitizeReviewHtml(rawText) }}
            />
          ) : (
            <p>{plainText.slice(0, TEXT_PREVIEW_LENGTH).trim()}…</p>
          )}
          {showMoreText && (
            <button
              type="button"
              onClick={() => onToggleText(review.id)}
              className="mt-0.5 font-medium text-primary hover:underline"
            >
              {textExpanded ? "Show less" : "More"}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {textExpanded || !showMoreText ? rawText : plainText.slice(0, TEXT_PREVIEW_LENGTH).trim() + "…"}
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
      )}

      {review.shooting_tip && (
        <div className="mt-3 flex gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground/70">{review.shooting_tip}</p>
        </div>
      )}

      {review.camera && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Camera className="h-3 w-3 shrink-0" />
          {review.camera}
        </div>
      )}

      {bestForTags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {visibleBestFor.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-[7px] border border-border/50 bg-secondary/30 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
            >
              {BEST_FOR_LABELS[tag as BestFor] ?? tag.replace(/_/g, " ")}
            </span>
          ))}
          {hasMoreBestFor && (
            <span className="text-xs font-medium text-muted-foreground" aria-hidden>
              …
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={likePending}
            onClick={async () => {
              if (!currentUserId) {
                showToastViaEvent("Log in to like reviews.");
                return;
              }
              setLikePending(true);
              try {
                const res = await fetch("/api/user/review-likes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ review_id: review.id }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  showToastViaEvent(data.error || "Could not update like");
                  return;
                }
                onLikeUpdated(review.id, data.liked, data.like_count);
              } finally {
                setLikePending(false);
              }
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-xs font-medium transition-colors",
              "hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50",
              review.liked_by_me
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/50 text-foreground/80"
            )}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                review.liked_by_me ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
            {review.liked_by_me ? "Liked" : "Like"}
          </button>
          {review.like_count > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">{review.like_count}</span>
          )}
      </div>
    </article>
  );
}

export function ReviewsTabContent({
  slug,
  showViewFilter = true,
}: {
  slug?: string;
  /** When false (e.g. overview embed), only “everyone” reviews; no Everyone/Following/You tabs. */
  showViewFilter?: boolean;
}) {
  const { user } = useAuth();
  const [view, setView] = useState<ReviewView>("everyone");
  const [reviews, setReviews] = useState<FilmReviewRow[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [expandedTextIds, setExpandedTextIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!slug) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail.slug === slug) refetch();
    };
    window.addEventListener("review-submitted", handler);
    return () => window.removeEventListener("review-submitted", handler);
  }, [slug, refetch]);

  const viewForData: ReviewView = showViewFilter ? view : "everyone";

  useEffect(() => {
    setPage(1);
  }, [viewForData, slug]);

  useEffect(() => {
    if (!slug) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetcher =
      viewForData === "you"
        ? getMyReviewsForFilmStock(slug)
        : viewForData === "following"
          ? getFollowingReviewsForFilmStock(slug)
          : getReviewsForFilmStock(slug);
    fetcher
      .then((data) => {
        setReviews(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, viewForData, refreshKey]);

  /** Popularity (likes) first, then newest. */
  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    return copy.sort((a, b) => {
      const likes = (b.like_count ?? 0) - (a.like_count ?? 0);
      if (likes !== 0) return likes;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviews]);

  const totalCount = sortedReviews.length;
  const usePagination = viewForData === "everyone" || viewForData === "following";
  const paginatedReviews = usePagination
    ? sortedReviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE)
    : sortedReviews;
  const totalPages = Math.max(1, Math.ceil(totalCount / REVIEWS_PER_PAGE));

  function toggleText(id: string) {
    setExpandedTextIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleLikeUpdated = useCallback((reviewId: string, liked: boolean, likeCount: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, liked_by_me: liked, like_count: likeCount } : r
      )
    );
  }, []);

  if (!slug) {
    return (
      <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">Select a film to see reviews.</p>
      </div>
    );
  }

  const showFollowingEmpty =
    !loading && viewForData === "following" && paginatedReviews.length === 0;
  const followingEmptyMessage = !user
    ? "Sign in to see reviews from people you follow."
    : "No reviews from people you follow for this film yet.";

  return (
    <div className={cn(showViewFilter ? "space-y-5" : "space-y-0")}>
      {showViewFilter ? (
        <SegmentedViewTabs
          value={view}
          onChange={setView}
          ariaLabel="Whose reviews to show"
        />
      ) : null}

      <div className="divide-y divide-border/40">
        {loading ? (
          <div className="rounded-[7px] border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
            Loading reviews…
          </div>
        ) : showFollowingEmpty ? (
          <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">{followingEmptyMessage}</p>
          </div>
        ) : viewForData === "you" && paginatedReviews.length === 0 ? (
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
              expandedTextIds={expandedTextIds}
              onToggleText={toggleText}
              currentUserId={user?.id ?? null}
              onLikeUpdated={handleLikeUpdated}
            />
          ))
        )}
      </div>

      {/* Pagination — Everyone / Following when more than one page */}
      {!loading && totalPages > 1 && usePagination && (
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
