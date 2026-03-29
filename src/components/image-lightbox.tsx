"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MessageCircle, MoreVertical, Share2, Star, X } from "lucide-react";
import { sanitizeReviewLikeHtml } from "@/lib/sanitize-review-like-html";

export type ImageLightboxMetadata = {
  camera?: string | null;
  shot_iso?: string | null;
  lens?: string | null;
  lab?: string | null;
  filter?: string | null;
  scanner?: string | null;
  push_pull?: string | null;
};

export type ImageLightboxData = {
  imageUrl: string;
  alt?: string;
  caption?: string | null;
  username?: string;
  metadata?: ImageLightboxMetadata;
  /** e.g. film stock — link in metadata */
  context?: { label: string; href: string };
};

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

export type ImageLightboxProps = {
  slides: ImageLightboxData[];
  initialIndex?: number;
  onClose: () => void;
};

/**
 * Full-screen lightbox: Flickr-style header (avatar, name, close), horizontal carousel for grouped uploads,
 * metadata below the fold (scroll or swipe up to reveal). Light: white chrome; dark: black chrome.
 */
export function ImageLightbox({ slides, initialIndex = 0, onClose }: ImageLightboxProps) {
  const safeSlides = slides.length > 0 ? slides : [];
  const [active, setActive] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, safeSlides.length - 1))
  );
  const carouselRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const i = Math.min(Math.max(0, initialIndex), Math.max(0, safeSlides.length - 1));
    setActive(i);
    requestAnimationFrame(() => {
      const el = carouselRef.current;
      if (!el) return;
      const w = el.clientWidth;
      if (w > 0) el.scrollLeft = i * w;
    });
  }, [initialIndex, safeSlides.length]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const onCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const i = Math.round(el.scrollLeft / w);
    setActive(Math.min(Math.max(0, i), safeSlides.length - 1));
  }, [safeSlides.length]);

  useEffect(() => {
    const s = mainScrollRef.current;
    if (s) s.scrollTop = 0;
  }, [active]);

  if (safeSlides.length === 0) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const current = safeSlides[active] ?? safeSlides[0];
  const hasMeta =
    current.metadata &&
    (current.metadata.camera ||
      current.metadata.shot_iso ||
      current.metadata.lens ||
      current.metadata.lab ||
      current.metadata.filter ||
      current.metadata.scanner ||
      current.metadata.push_pull);

  const name = current.username?.trim() || "Member";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white text-neutral-900 dark:bg-black dark:text-neutral-100"
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
    >
      {/* Header — above app chrome (header z-50); safe-area for notches */}
      <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-white/15">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-white/15 dark:text-white"
          aria-hidden
        >
          {getInitials(name)}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-2 text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Body: vertical scroll — metadata below first screen; action bar pinned */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={mainScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        >
          {/* One full scroll viewport: photo + handle hint; scroll down / swipe up for details */}
          <div className="flex min-h-full shrink-0 flex-col">
            <div className="relative min-h-0 flex-1 overflow-hidden bg-white dark:bg-black">
              <div
                ref={carouselRef}
                onScroll={onCarouselScroll}
                className="absolute inset-0 flex min-h-0 w-full items-stretch touch-pan-x snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {safeSlides.map((slide, i) => (
                  <div
                    key={`${slide.imageUrl}-${i}`}
                    className="flex h-auto min-h-0 w-full shrink-0 snap-center items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.imageUrl}
                      alt={slide.alt ?? ""}
                      className="max-h-full max-w-full object-contain object-center"
                      sizes="100vw"
                    />
                  </div>
                ))}
              </div>
              {safeSlides.length > 1 ? (
                <div
                  className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-1"
                  aria-hidden
                >
                  {safeSlides.map((_, i) => (
                    <span
                      key={i}
                      className={`block h-1 rounded-full transition-all ${
                        i === active ? "w-4 bg-neutral-800 dark:bg-white" : "w-1 bg-neutral-400/80 dark:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1 py-2">
              <span className="sr-only">Swipe up or scroll down for caption and details</span>
              <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-white/25" aria-hidden />
            </div>
          </div>

        <div className="border-t border-neutral-200 dark:border-white/10">
          <div className="space-y-6 px-4 py-4 pb-6">
            {current.caption ? (
              <section>
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Description
                </h2>
                <div
                  className="mt-2 text-sm leading-relaxed [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-2 dark:[&_blockquote]:border-white/20 [&_p]:m-0 [&_p]:mb-2 [&_p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: sanitizeReviewLikeHtml(current.caption) }}
                />
              </section>
            ) : null}

            {current.context ? (
              <section>
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Film stock
                </h2>
                <p className="mt-2">
                  <Link
                    href={current.context.href}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    onClick={onClose}
                  >
                    {current.context.label}
                  </Link>
                </p>
              </section>
            ) : null}

            {hasMeta ? (
              <section className="space-y-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Details
                </h2>
                <dl className="space-y-3">
                  {current.metadata!.camera ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Camera
                      </dt>
                      <dd className="mt-1 text-sm">{current.metadata!.camera}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.shot_iso ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Shot at ISO
                      </dt>
                      <dd className="mt-1 text-sm">{current.metadata!.shot_iso}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.lens ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Lens
                      </dt>
                      <dd className="mt-1 text-sm">{current.metadata!.lens}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.lab ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Lab / processing
                      </dt>
                      <dd className="mt-1 text-sm">{current.metadata!.lab}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.push_pull ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Push / pull
                      </dt>
                      <dd className="mt-1 text-sm">{current.metadata!.push_pull}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.filter ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Filter
                      </dt>
                      <dd className="mt-1 text-sm">{current.metadata!.filter}</dd>
                    </div>
                  ) : null}
                  {current.metadata!.scanner ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Scanner
                      </dt>
                      <dd className="mt-1 text-sm">{current.metadata!.scanner}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}

            {!current.caption && !current.context && !hasMeta ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No extra details for this shot.</p>
            ) : null}
          </div>
        </div>
        </div>

        {/* Pinned above home indicator; covers app bottom tab bar (typically ~64–72px) */}
        <div className="shrink-0 border-t border-neutral-200 bg-white px-2 pt-2 pb-[max(12px,calc(env(safe-area-inset-bottom,0px)+8px))] dark:border-white/10 dark:bg-black">
          <div className="flex justify-around pb-1">
            <button
              type="button"
              className="rounded-full p-3 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
              aria-label="Favorite"
            >
              <Star className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="rounded-full p-3 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
              aria-label="Comment"
            >
              <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="rounded-full p-3 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
              aria-label="Share"
            >
              <Share2 className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="rounded-full p-3 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
              aria-label="More"
            >
              <MoreVertical className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
