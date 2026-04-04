"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { HomeFeedGroup } from "@/app/actions/home-feed";

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

function HomeFeedPost({ group, stockLabel }: { group: HomeFeedGroup; stockLabel: string }) {
  const primary = group.uploads[0]!;
  const username = primary.display_name?.trim() || "Member";

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
    <article className="pb-12 last:pb-0">
      {isRoll ? (
        <div className="relative w-full">
          <div
            ref={scrollerRef}
            className="flex w-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5 px-3"
            role="status"
            aria-label={`${slides.length} photos, showing ${activeSlide + 1} of ${slides.length}`}
          >
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.35)] transition-colors",
                  i === activeSlide ? "bg-white" : "bg-white/55"
                )}
              />
            ))}
          </div>
        </div>
      ) : slides[0] ? (
        <div className="w-full">
          <Link href={`/films/${slides[0].film_stock_slug}?shot=${slides[0].id}`} className="block">
            <FeedImage src={slides[0].image_url} alt="" />
          </Link>
        </div>
      ) : null}

      <div className="mt-2.5 flex items-start gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={`/users/${group.user_id}`}
            className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-neutral-200 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary dark:bg-white/15"
            aria-label={`View ${username}'s profile`}
          >
            {primary.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.avatar_url} alt="" className="h-full w-full object-cover" width={24} height={24} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold leading-none text-neutral-700 dark:text-white">
                {getInitials(username)}
              </div>
            )}
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <Link
              href={`/users/${group.user_id}`}
              className="min-w-0 flex-1 basis-0 truncate text-xs font-medium leading-tight text-foreground outline-none ring-offset-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
            >
              {username}
            </Link>
            <Link
              href={`/films/${group.film_stock_slug}`}
              className="min-w-0 max-w-[min(50%,11rem)] shrink truncate text-right text-xs font-normal text-[#8A8A8A] outline-none ring-offset-2 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-primary dark:hover:text-neutral-300"
            >
              {stockLabel}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HomeFeedClient({
  initialGroups,
  stockLabelBySlug,
}: {
  initialGroups: HomeFeedGroup[];
  stockLabelBySlug: Record<string, string>;
}) {
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
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-8 sm:px-6 md:pb-8">
      {initialGroups.map((group) => {
        const label =
          stockLabelBySlug[group.film_stock_slug] ?? group.film_stock_slug.replace(/-/g, " ");
        return <HomeFeedPost key={group.key} group={group} stockLabel={label} />;
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
