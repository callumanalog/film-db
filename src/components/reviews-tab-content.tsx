"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { sanitizeReviewLikeHtml } from "@/lib/sanitize-review-like-html";
import {
  Star,
  StarHalf,
  Camera,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
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
import { LazyImage } from "@/components/lazy-image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AddReviewModal,
  type AddReviewModalPayload,
  type EditReviewSeed,
} from "@/components/add-review-modal";

function sanitizeReviewHtml(html: string): string {
  return sanitizeReviewLikeHtml(html);
}

type ReviewView = SegmentedView;

const REVIEWS_PER_PAGE = 30;
const TEXT_PREVIEW_LENGTH = 220;

/** Film context for opening the add/edit review modal from a review card. */
export type ReviewFlowFilmStock = {
  slug: string;
  name: string;
  format: string[];
  image_url: string | null;
  brand: { name: string; slug: string };
  iso?: number | null;
};

function slugToDisplayName(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

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
  onOpenOwnReviewActions,
}: {
  review: FilmReviewRow;
  displayName: string;
  expandedTextIds: Set<string>;
  onToggleText: (id: string) => void;
  currentUserId: string | null;
  onLikeUpdated: (reviewId: string, liked: boolean, likeCount: number) => void;
  onOpenOwnReviewActions?: () => void;
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
  const isOwnReview = Boolean(currentUserId && review.user_id === currentUserId);

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
        {isOwnReview && onOpenOwnReviewActions ? (
          <button
            type="button"
            onClick={onOpenOwnReviewActions}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {rating > 0 && (
        <div className="mt-3">
          <MiniStars rating={rating} size={16} />
        </div>
      )}

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/80">
          {isHtml ? (
            <>
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
            </>
          ) : (
            <p className="whitespace-pre-wrap">
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
        </div>

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
          aria-label={review.liked_by_me ? "Unlike review" : "Like review"}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1 rounded-full py-0.5 text-sm font-medium leading-relaxed transition-colors disabled:opacity-50",
            review.liked_by_me ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              review.liked_by_me ? "fill-primary text-primary" : "text-muted-foreground"
            )}
          />
          {review.liked_by_me && review.like_count > 0 ? (
            <span className="tabular-nums">{review.like_count}</span>
          ) : null}
        </button>
      </div>

      {review.scan_urls.length > 0 && (
        <div className="mt-3" aria-label="Scans submitted with this review">
          <div
            className={cn(
              "flex gap-2 overflow-x-auto pb-1",
              "snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            )}
          >
            {review.scan_urls.map((url, i) => (
              <a
                key={`${review.id}-scan-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="snap-start shrink-0 overflow-hidden rounded-[7px] border border-border/50 bg-muted ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Open scan ${i + 1} of ${review.scan_urls.length} in new tab`}
              >
                <LazyImage
                  src={url}
                  alt=""
                  wrapperClassName="block h-[4.5rem] w-[4.5rem] sm:h-[5rem] sm:w-[5rem]"
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
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
          {bestForTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-[7px] border border-border/50 bg-secondary/30 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
            >
              {BEST_FOR_LABELS[tag as BestFor] ?? tag.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

    </article>
  );
}

export function ReviewsTabContent({
  slug,
  showViewFilter = true,
  filmStock = null,
}: {
  slug?: string;
  /** When false (e.g. overview embed), only “everyone” reviews; no Everyone/Following/You tabs. */
  showViewFilter?: boolean;
  /** Stock shown on the page; used for edit-review modal header/thumbnail. */
  filmStock?: ReviewFlowFilmStock | null;
}) {
  const { user } = useAuth();
  const [view, setView] = useState<ReviewView>("everyone");
  const [reviews, setReviews] = useState<FilmReviewRow[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [expandedTextIds, setExpandedTextIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionsReview, setActionsReview] = useState<FilmReviewRow | null>(null);
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<FilmReviewRow | null>(null);
  const [editingReview, setEditingReview] = useState<FilmReviewRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const editSeed: EditReviewSeed | null = useMemo(() => {
    if (!editingReview) return null;
    return {
      id: editingReview.id,
      rating: editingReview.rating != null && editingReview.rating > 0 ? Number(editingReview.rating) : 0,
      review_text: editingReview.review_text,
      best_for: editingReview.best_for ?? [],
      existingScanUrls: editingReview.scan_urls ?? [],
    };
  }, [editingReview]);

  const modalStock = useMemo(() => {
    const stockSlug = editingReview?.film_stock_slug ?? slug ?? "";
    if (filmStock && filmStock.slug === stockSlug) {
      return {
        slug: filmStock.slug,
        name: filmStock.name,
        brand: filmStock.brand,
        format: filmStock.format ?? [],
        image_url: filmStock.image_url,
        iso: filmStock.iso,
      };
    }
    return {
      slug: stockSlug,
      name: slugToDisplayName(stockSlug),
      brand: { name: "", slug: "" },
      format: [] as string[],
      image_url: null as string | null,
    };
  }, [editingReview?.film_stock_slug, slug, filmStock]);

  const handleEditSubmit = useCallback(
    async (payload: AddReviewModalPayload) => {
      if (!user || !editingReview) return;
      const formData = new FormData();
      formData.set("film_stock_slug", modalStock.slug);
      formData.set("mode", "review");
      formData.set("rating", String(payload.rating));
      if (payload.reviewTitle) formData.set("review_title", payload.reviewTitle);
      if (payload.reviewText) formData.set("review_text", payload.reviewText);
      if (payload.camera) formData.set("camera", payload.camera);
      if (payload.lens) formData.set("lens", payload.lens);
      if (payload.developedAt) formData.set("developed_at", payload.developedAt);
      if (payload.caption) formData.set("caption", payload.caption);
      if (payload.shotIso) formData.set("shot_iso", payload.shotIso);
      if (payload.lab) formData.set("lab", payload.lab);
      if (payload.filter) formData.set("filter", payload.filter);
      if (payload.scanner) formData.set("scanner", payload.scanner);
      if (payload.format) formData.set("format", payload.format);
      if (payload.location) formData.set("location", payload.location);
      if (payload.iso) formData.set("iso", payload.iso);
      if (payload.bestFor?.length) formData.set("best_for", JSON.stringify(payload.bestFor));
      if (payload.uploadedImageUrl) formData.set("image_url", payload.uploadedImageUrl);
      payload.files.forEach((file, i) => formData.append(`file_${i}`, file));

      try {
        const res = await fetch(`/api/user/reviews/${editingReview.id}`, {
          method: "PATCH",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = [data.error, data.detail].filter(Boolean).join(" ");
          showToastViaEvent(msg || "Could not save changes");
          return;
        }
        showToastViaEvent("Review updated.");
        window.dispatchEvent(
          new CustomEvent("review-submitted", { detail: { slug: modalStock.slug } })
        );
        setEditModalOpen(false);
        setEditingReview(null);
        refetch();
      } catch {
        showToastViaEvent("Could not save changes");
      }
    },
    [user, editingReview, modalStock.slug, refetch]
  );

  const confirmDeleteReview = useCallback(async () => {
    if (!deleteConfirmReview || !user) return;
    setDeletePending(true);
    try {
      const res = await fetch(`/api/user/reviews/${deleteConfirmReview.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToastViaEvent(data.error || "Could not delete review");
        return;
      }
      showToastViaEvent("Review deleted.");
      window.dispatchEvent(
        new CustomEvent("review-submitted", {
          detail: { slug: deleteConfirmReview.film_stock_slug },
        })
      );
      setDeleteConfirmReview(null);
      refetch();
    } catch {
      showToastViaEvent("Could not delete review");
    } finally {
      setDeletePending(false);
    }
  }, [deleteConfirmReview, user, refetch]);

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

      <div className="divide-y divide-border/40 border-b border-border/40">
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
              onOpenOwnReviewActions={() => setActionsReview(review)}
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

      <Sheet open={!!actionsReview} onOpenChange={(o) => !o && setActionsReview(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 pb-8">
          <SheetTitle className="sr-only">Review actions</SheetTitle>
          <div className="flex flex-col px-4">
            <button
              type="button"
              onClick={() => {
                const r = actionsReview;
                setActionsReview(null);
                if (r) {
                  setEditingReview(r);
                  setTimeout(() => setEditModalOpen(true), 200);
                }
              }}
              className="w-full py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Edit review
            </button>
            <button
              type="button"
              onClick={() => {
                const r = actionsReview;
                setActionsReview(null);
                if (r) setDeleteConfirmReview(r);
              }}
              className="w-full border-t border-border/50 py-4 text-left text-sm font-medium text-destructive transition-colors hover:text-destructive/90"
            >
              Delete review
            </button>
            <button
              type="button"
              onClick={() => setActionsReview(null)}
              className="w-full border-t border-border/50 pt-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!deleteConfirmReview} onOpenChange={(o) => !o && !deletePending && setDeleteConfirmReview(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left text-base font-semibold">Delete your review?</SheetTitle>
          </SheetHeader>
          <p className="px-4 pb-4 text-sm text-muted-foreground">
            This removes your review and any scans you attached to it.
          </p>
          <div className="flex flex-col gap-2 px-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteConfirmReview(null)}
              disabled={deletePending}
              className="order-2 rounded-[7px] border border-border/50 bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50 disabled:opacity-50 sm:order-1"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={confirmDeleteReview}
              disabled={deletePending}
              className="order-1 rounded-[7px] bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50 sm:order-2"
            >
              {deletePending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {editingReview && (
        <AddReviewModal
          open={editModalOpen}
          onOpenChange={(o) => {
            setEditModalOpen(o);
            if (!o) setEditingReview(null);
          }}
          mode="review"
          stock={modalStock}
          edit={editSeed}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
