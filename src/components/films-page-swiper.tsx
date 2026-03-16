"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TAB_IDS = ["stocks", "shots", "notes", "brands", "users"] as const;
type TabId = (typeof TAB_IDS)[number];

function tabToIndex(tab: string | null): number {
  const i = TAB_IDS.indexOf(tab as TabId);
  return i >= 0 ? i : 0;
}

function indexToTab(index: number): TabId {
  return TAB_IDS[Math.max(0, Math.min(index, TAB_IDS.length - 1))];
}

const RESISTANCE = 0.35;
const RUBBER_BAND_MAX = 60;

interface FilmsPageSwiperProps {
  children: React.ReactNode;
  panelShots?: React.ReactNode;
  panelNotes?: React.ReactNode;
  panelBrands?: React.ReactNode;
  panelUsers?: React.ReactNode;
  className?: string;
}

export function FilmsPageSwiper({
  children,
  panelShots,
  panelNotes,
  panelBrands,
  panelUsers,
  className,
}: FilmsPageSwiperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get?.("tab") ?? null;
  const indexFromUrl = tabToIndex(tabParam === "shots" ? "shots" : tabParam === "notes" ? "notes" : tabParam === "brands" ? "brands" : tabParam === "users" ? "users" : "stocks");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [rubberBand, setRubberBand] = useState(0);
  const touchStartX = useRef(0);
  const touchStartScrollLeft = useRef(0);
  const isCarouselTouch = useRef(false);
  const rafRef = useRef<number | null>(null);

  const getScrollWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return { width: 0, maxScroll: 0 };
    const width = el.clientWidth;
    const maxScroll = Math.max(0, el.scrollWidth - width);
    return { width, maxScroll };
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const { width } = getScrollWidth();
      const target = index * width;
      el.scrollTo({ left: target, behavior: "smooth" });
    },
    [getScrollWidth]
  );

  // Sync URL -> scroll position (e.g. after tapping a tab); run after layout so clientWidth is set
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const { width } = getScrollWidth();
      if (width === 0) return;
      const target = indexFromUrl * width;
      if (Math.abs(el.scrollLeft - target) > 2) {
        el.scrollLeft = target;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [indexFromUrl, getScrollWidth]);

  // On scroll end, update URL from scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const { width, maxScroll } = getScrollWidth();
          if (maxScroll <= 0 || width === 0) return;
          const index = Math.round(el.scrollLeft / width);
          const tab = indexToTab(index);
          const paramStr = typeof searchParams?.toString === "function" ? searchParams.toString() : "";
          const current = new URLSearchParams(paramStr).get("tab");
          const expected = tab === "stocks" ? null : tab;
          if (current !== expected) {
            const params = new URLSearchParams(paramStr);
            if (tab === "stocks") params.delete("tab");
            else params.set("tab", tab);
            const q = params.toString();
            router.replace(q ? `/films?${q}` : "/films", { scroll: false });
          }
        }, 120);
      });
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [getScrollWidth, router, searchParams]);

  // Rubber-band: touch handlers when at first or last tab
  const atLeftEdge = useCallback(() => {
    const el = scrollRef.current;
    return el ? el.scrollLeft <= 1 : true;
  }, []);
  const atRightEdge = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    const { maxScroll } = getScrollWidth();
    return maxScroll <= 0 || el.scrollLeft >= maxScroll - 1;
  }, [getScrollWidth]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      isCarouselTouch.current = target.closest("[data-carousel]") !== null;
      touchStartX.current = e.touches[0].clientX;
      touchStartScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
      setRubberBand(0);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isCarouselTouch.current) return;
      const el = scrollRef.current;
      if (!el) return;

      const dx = e.touches[0].clientX - touchStartX.current;
      const { maxScroll } = getScrollWidth();

      if (atLeftEdge() && dx > 0) {
        // Pull right on first tab -> rubber-band right
        const pull = Math.min(dx * RESISTANCE, RUBBER_BAND_MAX);
        setRubberBand(pull);
        e.preventDefault();
        return;
      }
      if (atRightEdge() && dx < 0) {
        // Pull left on last tab -> rubber-band left
        const pull = Math.max(dx * RESISTANCE, -RUBBER_BAND_MAX);
        setRubberBand(pull);
        e.preventDefault();
        return;
      }
      setRubberBand(0);
    },
    [atLeftEdge, atRightEdge, getScrollWidth]
  );

  const handleTouchEnd = useCallback(() => {
    setRubberBand(0);
    isCarouselTouch.current = false;
  }, []);

  return (
    <div
      className={cn("flex-1 min-h-0 flex flex-col", className)}
      style={{ touchAction: "pan-x" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={scrollRef}
        className="flex overflow-x-auto overflow-y-hidden flex-1 min-h-0 snap-x snap-mandatory scrollbar-hide"
        style={{
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
        }}
      >
        <div
          className="flex shrink-0 min-h-0"
          style={{
            transform: rubberBand !== 0 ? `translateX(${rubberBand}px)` : undefined,
            transition: rubberBand === 0 ? "transform 0.2s ease-out" : "none",
          }}
        >
          <div className="flex shrink-0 w-full min-h-0 snap-center snap-always">
            <div className="w-full min-h-0" style={{ touchAction: "pan-y" }}>{children}</div>
          </div>
          <div className="flex shrink-0 w-full min-h-0 snap-center snap-always">
            <div className="w-full min-h-0" style={{ touchAction: "pan-y" }}>{panelShots ?? <Placeholder label="Shots" />}</div>
          </div>
          <div className="flex shrink-0 w-full min-h-0 snap-center snap-always">
            <div className="w-full min-h-0" style={{ touchAction: "pan-y" }}>{panelNotes ?? <Placeholder label="Notes" />}</div>
          </div>
          <div className="flex shrink-0 w-full min-h-0 snap-center snap-always">
            <div className="w-full min-h-0" style={{ touchAction: "pan-y" }}>{panelBrands ?? <Placeholder label="Brands" />}</div>
          </div>
          <div className="flex shrink-0 w-full min-h-0 snap-center snap-always">
            <div className="w-full min-h-0" style={{ touchAction: "pan-y" }}>{panelUsers ?? <Placeholder label="Users" />}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
