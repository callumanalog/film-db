"use client";

import { useState, useMemo } from "react";
import {
  Star,
  StarHalf,
  ThumbsUp,
  Camera,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { MOCK_REVIEWS_PAGE, MOCK_REVIEWS_TOTAL, type MockReview } from "@/lib/mock-reviews";
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
const IMAGES_PREVIEW_COUNT = 3;

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

function ReviewCard({
  review,
  likedIds,
  onToggleLike,
  expandedTextIds,
  onToggleText,
  expandedImageIds,
  onToggleImages,
  expandedRepliesIds,
  onToggleReplies,
}: {
  review: MockReview;
  likedIds: Set<string>;
  onToggleLike: (id: string) => void;
  expandedTextIds: Set<string>;
  onToggleText: (id: string) => void;
  expandedImageIds: Set<string>;
  onToggleImages: (id: string) => void;
  expandedRepliesIds: Set<string>;
  onToggleReplies: (id: string) => void;
}) {
  const textExpanded = expandedTextIds.has(review.id);
  const imagesExpanded = expandedImageIds.has(review.id);
  const previewText =
    review.text.length <= TEXT_PREVIEW_LENGTH
      ? review.text
      : review.text.slice(0, TEXT_PREVIEW_LENGTH).trim() + "…";
  const showMoreText = review.text.length > TEXT_PREVIEW_LENGTH;
  const displayText = textExpanded ? review.text : previewText;
  const imageCount = review.images.length;
  const previewImages = review.images.slice(0, IMAGES_PREVIEW_COUNT);
  const remainingImages = imageCount - IMAGES_PREVIEW_COUNT;
  const showMoreImages = imageCount > IMAGES_PREVIEW_COUNT && !imagesExpanded;
  const liked = likedIds.has(review.id);
  const displayLikes = review.likes + (liked ? 1 : 0);

  return (
    <article className="rounded-xl border border-border/50 bg-card overflow-hidden transition-colors hover:border-border">
      <div className="p-5">
        {/* 1. Header: avatar, Review by + username, star icons, date, more options */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {review.avatar}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Review by{" "}
                <a
                  href="#"
                  className="font-medium text-foreground hover:text-primary"
                  onClick={(e) => e.preventDefault()}
                >
                  {review.username}
                </a>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <MiniStars rating={review.rating} size={14} />
                <span className="text-muted-foreground/60">·</span>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.preventDefault()}
                >
                  {review.date}
                </a>
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

        {/* 2. Images underneath the header */}
        {imageCount > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {(imagesExpanded ? review.images : previewImages).map((src, idx) => (
                <div
                  key={`${review.id}-img-${idx}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    aria-hidden
                  />
                </div>
              ))}
              {showMoreImages && (
                <button
                  type="button"
                  onClick={() => onToggleImages(review.id)}
                  className="flex h-24 min-w-[5rem] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  +{remainingImages} more
                </button>
              )}
              {imagesExpanded && remainingImages > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleImages(review.id)}
                  className="flex h-24 min-w-[5rem] items-center justify-center rounded-lg border border-border bg-secondary/50 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Review title/header (italic, like reference) */}
        <p className="mt-3 text-sm font-medium italic text-foreground">
          {review.title}
        </p>

        {/* 4. Body */}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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

        {/* 5. Like */}
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <button
            onClick={() => onToggleLike(review.id)}
            className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
              liked ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-primary" : ""}`} />
            {displayLikes}
          </button>
          {review.replies.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleReplies(review.id)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              {expandedRepliesIds.has(review.id) ? "Hide" : `${review.replies.length} ${review.replies.length === 1 ? "reply" : "replies"}`}
            </button>
          )}
        </div>

        {/* 6. Replies (hidden until tapped) */}
        {review.replies.length > 0 && expandedRepliesIds.has(review.id) && (
          <div className="mt-4 pl-6 border-l-2 border-border/60 space-y-3">
            {review.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                  {reply.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    <a href="#" className="font-medium text-foreground hover:text-primary" onClick={(e) => e.preventDefault()}>
                      {reply.username}
                    </a>
                    {" · "}
                    <span>{reply.date}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/90">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function ReviewsTabContent() {
  const [view, setView] = useState<ReviewView>("everyone");
  const [sort, setSort] = useState<string>("popular");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [expandedTextIds, setExpandedTextIds] = useState<Set<string>>(new Set());
  const [expandedImageIds, setExpandedImageIds] = useState<Set<string>>(new Set());
  const [expandedRepliesIds, setExpandedRepliesIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filteredReviews = useMemo(() => {
    let list =
      view === "you"
        ? MOCK_REVIEWS_PAGE.filter((rev) => rev.username === "nightcrawler_35mm") // mock "current user"
        : [...MOCK_REVIEWS_PAGE];
    if (sort === "popular") {
      list = [...list].sort((a, b) => b.likes - a.likes);
    } else {
      // newest: keep existing order (mock is already newest first)
      list = [...list];
    }
    return list;
  }, [view, sort]);

  const totalPages = Math.ceil(MOCK_REVIEWS_TOTAL / REVIEWS_PER_PAGE);
  const displayTotal = view === "you" ? filteredReviews.length : MOCK_REVIEWS_TOTAL;
  const start = view === "you" ? (filteredReviews.length ? 1 : 0) : (page - 1) * REVIEWS_PER_PAGE + 1;
  const end = view === "you" ? filteredReviews.length : Math.min(page * REVIEWS_PER_PAGE, MOCK_REVIEWS_TOTAL);

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleText(id: string) {
    setExpandedTextIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleImages(id: string) {
    setExpandedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleReplies(id: string) {
    setExpandedRepliesIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Row 1: [Everyone | You] ............................... + Write review */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="inline-flex rounded-lg border border-border/60 bg-secondary/30 p-0.5"
          role="tablist"
          aria-label="Review view"
        >
          {(["everyone", "you"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                view === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "everyone" ? "Everyone" : "You"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Write review
        </button>
      </div>

      {/* Row 2: Showing 1-50 of 152 reviews    [Sort dropdown] */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {displayTotal === 0
            ? "No reviews yet"
            : `Showing ${start}–${end} of ${displayTotal} reviews`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sort by:
          </span>
          <Select value={sort} onValueChange={(v) => setSort(v ?? "popular")}>
            <SelectTrigger className="w-[140px]" size="sm">
              <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Popular"}</span>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Long scroll: list of review cards */}
      <div className="space-y-4">
        {filteredReviews.length === 0 && view === "you" ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">You haven’t reviewed this film yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Write a review to see it here.</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Write review
            </button>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              likedIds={likedIds}
              onToggleLike={toggleLike}
              expandedTextIds={expandedTextIds}
              onToggleText={toggleText}
              expandedImageIds={expandedImageIds}
              onToggleImages={toggleImages}
              expandedRepliesIds={expandedRepliesIds}
              onToggleReplies={toggleReplies}
            />
          ))
        )}
      </div>

      {/* Pagination — after 50 reviews (only when viewing Everyone) */}
      {totalPages > 1 && view === "everyone" && (
        <div className="flex items-center justify-center gap-2 border-t border-border/50 pt-8">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
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
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
