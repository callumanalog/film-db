"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeFeedGroup } from "@/app/actions/home-feed";
import { toggleLikeUpload } from "@/app/actions/upload-likes";
import { toggleSaveUpload } from "@/app/actions/saved-uploads";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

function FeedImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="block h-auto max-h-[85dvh] w-full object-contain" sizes="(max-width: 768px) 100vw, 720px" loading="lazy" />
  );
}

function HomeFeedPost({
  group,
  stockLabel,
  displayLikeCount,
  likedIds,
  savedIds,
  onLikeDelta,
  onSaveDelta,
  onComment,
}: {
  group: HomeFeedGroup;
  stockLabel: string;
  displayLikeCount: number;
  likedIds: Set<string>;
  savedIds: Set<string>;
  onLikeDelta: (uploadId: string, liked: boolean, delta: number) => void;
  onSaveDelta: (uploadId: string, saved: boolean) => void;
  onComment: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const primary = group.uploads[0]!;
  const username = primary.display_name?.trim() || "Member";
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`;

  const [pendingLike, setPendingLike] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  const likeOne = useCallback(async () => {
    if (!user) {
      router.push(signInHref);
      return;
    }
    setPendingLike(true);
    const res = await toggleLikeUpload(primary.id);
    setPendingLike(false);
    if (!res.ok) {
      if (res.error === "sign_in_required") router.push(signInHref);
      else showToastViaEvent("Could not update like.");
      return;
    }
    onLikeDelta(primary.id, res.liked, res.liked ? 1 : -1);
  }, [onLikeDelta, primary.id, router, signInHref, user]);

  const saveOne = useCallback(async () => {
    if (!user) {
      router.push(signInHref);
      return;
    }
    setPendingSave(true);
    const res = await toggleSaveUpload(primary.id);
    setPendingSave(false);
    if (!res.ok) {
      if (res.error === "sign_in_required") router.push(signInHref);
      else showToastViaEvent("Could not update save.");
      return;
    }
    onSaveDelta(primary.id, res.saved);
  }, [onSaveDelta, primary.id, router, signInHref, user]);

  const primaryLiked = likedIds.has(primary.id);
  const primarySaved = savedIds.has(primary.id);

  const slides = group.uploads.filter((u): u is typeof u & { image_url: string } => Boolean(u.image_url));
  const isRoll = slides.length > 1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setActiveSlide(0);
    const el = scrollerRef.current;
    if (el && isRoll) el.scrollTo({ left: 0 });
  }, [group.key, isRoll]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !isRoll) return;
    const sync = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const idx = Math.round(el.scrollLeft / w);
      setActiveSlide(Math.min(Math.max(idx, 0), slides.length - 1));
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [isRoll, slides.length, group.key]);

  return (
    <article className="pb-8 last:pb-0">
      {isRoll ? (
        <>
          <div
            ref={scrollerRef}
            className="flex w-full snap-x snap-mandatory overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Photos from this roll"
          >
            {slides.map((u) => (
              <div
                key={u.id}
                className="shrink-0 grow-0 basis-full snap-start"
              >
                <Link href={`/films/${u.film_stock_slug}?shot=${u.id}`} className="block">
                  <FeedImage src={u.image_url} alt="" />
                </Link>
              </div>
            ))}
          </div>
          <div
            className="flex justify-center gap-1.5 pt-2"
            role="status"
            aria-label={`${slides.length} photos, showing ${activeSlide + 1} of ${slides.length}`}
          >
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === activeSlide ? "bg-foreground" : "bg-muted-foreground/35"
                )}
              />
            ))}
          </div>
        </>
      ) : slides[0] ? (
        <div className="w-full">
          <Link href={`/films/${slides[0].film_stock_slug}?shot=${slides[0].id}`} className="block">
            <FeedImage src={slides[0].image_url} alt="" />
          </Link>
        </div>
      ) : null}

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 max-w-[65%] items-center gap-3 sm:max-w-[70%]">
          <Link
            href={`/users/${group.user_id}`}
            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary dark:bg-white/15"
            aria-label={`View ${username}'s profile`}
          >
            {primary.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.avatar_url} alt="" className="h-full w-full object-cover" width={36} height={36} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-neutral-700 dark:text-white">
                {getInitials(username)}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/users/${group.user_id}`}
              className="block truncate text-sm font-semibold leading-tight text-foreground outline-none ring-offset-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
            >
              {username}
            </Link>
            <Link
              href={`/films/${group.film_stock_slug}`}
              className="block truncate text-xs font-normal text-neutral-400 outline-none ring-offset-2 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-primary dark:hover:text-neutral-300"
            >
              {stockLabel}
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 self-start">
          <button
            type="button"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              primaryLiked && "text-primary"
            )}
            aria-label={primaryLiked ? "Unlike" : "Like"}
            disabled={pendingLike}
            onClick={() => void likeOne()}
          >
            <Heart className={cn("h-6 w-6 shrink-0", primaryLiked && "fill-current")} strokeWidth={1.75} />
          </button>
          {displayLikeCount > 0 ? (
            <span className="mr-0.5 flex h-10 min-w-[1.25rem] items-center text-sm font-medium tabular-nums text-muted-foreground">
              {displayLikeCount}
            </span>
          ) : null}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Comment"
            onClick={onComment}
          >
            <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              primarySaved && "text-primary"
            )}
            aria-label={primarySaved ? "Remove save" : "Save"}
            disabled={pendingSave}
            onClick={() => void saveOne()}
          >
            <Bookmark className={cn("h-6 w-6 shrink-0", primarySaved && "fill-current")} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function HomeFeedClient({
  initialGroups,
  stockLabelBySlug,
  initialLikedIds,
  initialSavedIds,
}: {
  initialGroups: HomeFeedGroup[];
  stockLabelBySlug: Record<string, string>;
  initialLikedIds: string[];
  initialSavedIds: string[];
}) {
  const [likedIds, setLikedIds] = useState(() => new Set(initialLikedIds));
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds));
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const g of initialGroups) {
      const u = g.uploads[0];
      if (u) m[u.id] = u.like_count ?? 0;
    }
    return m;
  });

  const onLikeDelta = useCallback((uploadId: string, liked: boolean, delta: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(uploadId);
      else next.delete(uploadId);
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [uploadId]: Math.max(0, (prev[uploadId] ?? 0) + delta),
    }));
  }, []);

  const onSaveDelta = useCallback((uploadId: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(uploadId);
      else next.delete(uploadId);
      return next;
    });
  }, []);

  const onComment = useCallback(() => {
    showToastViaEvent("Comments coming soon");
  }, []);

  if (initialGroups.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm font-medium text-muted-foreground">
          No posts yet. Follow people and film stocks, or post your own scans to see them here.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Use <span className="font-medium text-foreground">Follow</span> on a film stock page to add its community uploads to your feed.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-2 sm:px-6 md:pb-8">
      {initialGroups.map((group) => {
        const label =
          stockLabelBySlug[group.film_stock_slug] ?? group.film_stock_slug.replace(/-/g, " ");
        const primaryId = group.uploads[0]!.id;
        const displayLikeCount = counts[primaryId] ?? group.uploads[0]!.like_count ?? 0;
        return (
          <HomeFeedPost
            key={group.key}
            group={group}
            stockLabel={label}
            displayLikeCount={displayLikeCount}
            likedIds={likedIds}
            savedIds={savedIds}
            onLikeDelta={onLikeDelta}
            onSaveDelta={onSaveDelta}
            onComment={onComment}
          />
        );
      })}
    </div>
  );
}

export function HomeFeedSignedOut() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <h1 className="text-xl font-bold tracking-tight">Home</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Log in to see scans from people and stocks you follow, plus your own posts.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent("/")}`}
          className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Log in
        </Link>
        <Link href="/auth/sign-up" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
