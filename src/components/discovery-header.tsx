"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";
import type { BestFor } from "@/lib/types";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ClearFiltersLink } from "@/components/clear-filters-link";
import { FilmsSortBar } from "@/components/films-sort-bar";

type SortValue = "highest-rated" | "alphabetical";

/** Discovery pill: label and bestFor filters applied when tapped. */
const DISCOVERY_PILLS: { id: string; label: string; bestFor: BestFor[] }[] = [
  { id: "essential_everyday", label: "Essential Everyday", bestFor: ["general_purpose"] },
  { id: "golden_hour", label: "Golden Hour", bestFor: ["golden_hour", "landscapes"] },
  { id: "dreamy_portraits", label: "Dreamy Portraits", bestFor: ["portrait", "weddings"] },
  { id: "gritty_street", label: "Gritty Street", bestFor: ["street", "documentary"] },
  { id: "cinematic_nights", label: "Cinematic Nights", bestFor: ["artificial_light", "low_light"] },
  { id: "vivid_landscapes", label: "Vivid Landscapes", bestFor: ["landscapes", "bright_sun"] },
  { id: "nostalgic_travel", label: "Nostalgic Travel", bestFor: ["travel"] },
  { id: "experimental", label: "Experimental", bestFor: ["experimental"] },
];

/** Gradient palette: dot and border match; gradient30/60 = border opacity; activeBgTint = 5%; activeBgTint10 = 10% (mobile drawer). activeTextClass = optional dark text when active (e.g. Dreamy Portraits). */
const PILL_THEMES: Record<
  string,
  { gradient: string; gradient30: string; gradient60: string; activeBgTint: string; activeBgTint10: string; activeTextClass?: string }
> = {
  golden_hour: {
    gradient: "linear-gradient(135deg, #FFB74D 0%, #F4511E 100%)",
    gradient30: "linear-gradient(135deg, rgba(255,183,77,0.3) 0%, rgba(244,81,30,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(255,183,77,0.6) 0%, rgba(244,81,30,0.6) 100%)",
    activeBgTint: "rgba(255,183,77,0.05)",
    activeBgTint10: "rgba(255,183,77,0.1)",
  },
  dreamy_portraits: {
    gradient: "linear-gradient(135deg, #E9D5FF 0%, #FDE68A 100%)",
    gradient30: "linear-gradient(135deg, rgba(233,213,255,0.3) 0%, rgba(253,230,138,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(233,213,255,0.6) 0%, rgba(253,230,138,0.6) 100%)",
    activeBgTint: "rgba(233,213,255,0.05)",
    activeBgTint10: "rgba(233,213,255,0.1)",
  },
  gritty_street: {
    gradient: "linear-gradient(135deg, #424242 0%, #111111 100%)",
    gradient30: "linear-gradient(135deg, rgba(66,66,66,0.3) 0%, rgba(17,17,17,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(66,66,66,0.6) 0%, rgba(17,17,17,0.6) 100%)",
    activeBgTint: "rgba(66,66,66,0.05)",
    activeBgTint10: "rgba(66,66,66,0.1)",
  },
  cinematic_nights: {
    gradient: "linear-gradient(135deg, #4DD0E1 0%, #9575CD 100%)",
    gradient30: "linear-gradient(135deg, rgba(77,208,225,0.3) 0%, rgba(149,117,205,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(77,208,225,0.6) 0%, rgba(149,117,205,0.6) 100%)",
    activeBgTint: "rgba(77,208,225,0.05)",
    activeBgTint10: "rgba(77,208,225,0.1)",
  },
  vivid_landscapes: {
    gradient: "linear-gradient(135deg, #2E7D32 0%, #0277BD 100%)",
    gradient30: "linear-gradient(135deg, rgba(46,125,50,0.3) 0%, rgba(2,119,189,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(46,125,50,0.6) 0%, rgba(2,119,189,0.6) 100%)",
    activeBgTint: "rgba(46,125,50,0.05)",
    activeBgTint10: "rgba(46,125,50,0.1)",
  },
  essential_everyday: {
    gradient: "linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)",
    gradient30: "linear-gradient(135deg, rgba(203,213,225,0.3) 0%, rgba(148,163,184,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(203,213,225,0.6) 0%, rgba(148,163,184,0.6) 100%)",
    activeBgTint: "rgba(203,213,225,0.05)",
    activeBgTint10: "rgba(203,213,225,0.1)",
  },
  nostalgic_travel: {
    gradient: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)",
    gradient30: "linear-gradient(135deg, rgba(253,230,138,0.3) 0%, rgba(245,158,11,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(253,230,138,0.6) 0%, rgba(245,158,11,0.6) 100%)",
    activeBgTint: "rgba(253,230,138,0.05)",
    activeBgTint10: "rgba(253,230,138,0.1)",
  },
  experimental: {
    gradient: "linear-gradient(135deg, #BA68C8 0%, #F06292 100%)",
    gradient30: "linear-gradient(135deg, rgba(186,104,200,0.3) 0%, rgba(240,98,146,0.3) 100%)",
    gradient60: "linear-gradient(135deg, rgba(186,104,200,0.6) 0%, rgba(240,98,146,0.6) 100%)",
    activeBgTint: "rgba(186,104,200,0.05)",
    activeBgTint10: "rgba(186,104,200,0.1)",
  },
};

/** Sentence case for mobile drawer labels: first letter cap, rest lower. */
function toSentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface DiscoveryHeaderProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
  currentSort: SortValue;
}

export function DiscoveryHeader({ brands, filterOptions, currentSort }: DiscoveryHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vibesDrawerOpen, setVibesDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchDrawerClosing, setSearchDrawerClosing] = useState(false);
  const [searchDrawerReady, setSearchDrawerReady] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchInput, setMobileSearchInput] = useState("");
  const [hoveredPillId, setHoveredPillId] = useState<string | null>(null);
  const defaultSearch = searchParams.get("search") ?? "";

  const getBestForFromUrl = useCallback(() => {
    const v = searchParams.get("bestFor");
    if (!v) return [];
    return [...v.split(",").map((s) => s.trim()).filter(Boolean)].sort();
  }, [searchParams]);

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const q = params.toString();
      return q ? `/films?${q}` : "/films";
    },
    [searchParams]
  );

  const currentBestFor = getBestForFromUrl();

  const setDiscoveryPill = useCallback(
    (pill: (typeof DISCOVERY_PILLS)[number], active: boolean) => {
      if (active) {
        router.push(buildUrl({ bestFor: null, vibe: null }));
      } else {
        const value = pill.bestFor.length > 0 ? pill.bestFor.join(",") : null;
        router.push(buildUrl({ bestFor: value, vibe: null }));
      }
    },
    [router, buildUrl]
  );

  const isPillActive = useCallback(
    (pill: (typeof DISCOVERY_PILLS)[number]) => {
      const pillSet = [...pill.bestFor].sort();
      if (currentBestFor.length !== pillSet.length) return false;
      return pillSet.every((bf, i) => currentBestFor[i] === bf);
    },
    [currentBestFor]
  );

  const activePill = DISCOVERY_PILLS.find((p) => isPillActive(p));

  const [searchInput, setSearchInput] = useState(defaultSearch);
  const [searchExpanded, setSearchExpanded] = useState(!!defaultSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchInput(defaultSearch);
    if (defaultSearch) setSearchExpanded(true);
  }, [defaultSearch]);

  useEffect(() => {
    if (searchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [searchExpanded]);

  // Mobile search drawer: slide-up ready after mount, focus input when open
  useEffect(() => {
    if (mobileSearchOpen) {
      setMobileSearchInput(defaultSearch);
      setSearchDrawerReady(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSearchDrawerReady(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setSearchDrawerReady(false);
    }
  }, [mobileSearchOpen, defaultSearch]);

  useEffect(() => {
    if (mobileSearchOpen && searchDrawerReady) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen, searchDrawerReady]);

  // Close animation: after 300ms unmount
  useEffect(() => {
    if (!searchDrawerClosing) return;
    const t = setTimeout(() => {
      setMobileSearchOpen(false);
      setSearchDrawerClosing(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchDrawerClosing]);

  // Lock body scroll when any drawer/modal is open (Search, Vibes, or Filters)
  useEffect(() => {
    const isOpen = drawerOpen || mobileSearchOpen || vibesDrawerOpen || searchDrawerClosing;
    if (isOpen) {
      const prevHtml = document.documentElement.style.overflow;
      const prevBody = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prevHtml;
        document.body.style.overflow = prevBody;
      };
    }
  }, [drawerOpen, mobileSearchOpen, vibesDrawerOpen, searchDrawerClosing]);

  const closeMobileSearchDrawer = useCallback(() => {
    setSearchDrawerClosing(true);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    router.push(buildUrl({ search: q || null }));
    // Keep bar expanded so the user's search term stays visible
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = mobileSearchInput.trim();
    router.push(buildUrl({ search: q || null }));
    closeMobileSearchDrawer();
  };

  const handleBrandTap = useCallback(
    (brand: FilmBrand) => {
      router.push(buildUrl({ search: brand.name }));
      closeMobileSearchDrawer();
    },
    [router, buildUrl, closeMobileSearchDrawer]
  );

  return (
    <>
      <header className="text-center">
        <h1 className="font-advercase text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Discover your next film
        </h1>
        <p className="mx-auto mt-2 max-w-xl font-sans text-sm text-muted-foreground sm:text-base">
          From sun-drenched portraits to gritty midnight streets—choose a mood below to find the perfect chemistry for your vision.
        </p>

        {/* Discovery Ribbon: hidden below 768px; on mobile use Vibes button + bottom drawer */}
        <div className="mt-6 hidden px-4 sm:px-6 md:block">
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2.5 py-1.5">
            {DISCOVERY_PILLS.map((pill) => {
              const theme = PILL_THEMES[pill.id] ?? PILL_THEMES.experimental;
              const active = isPillActive(pill);
              const isHovered = hoveredPillId === pill.id && !active;
              const useGradientBorder = active || isHovered;
              const borderGradient = active ? theme.gradient : theme.gradient60;
              const fillBg = active ? theme.activeBgTint : "white";
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setDiscoveryPill(pill, active)}
                  onMouseEnter={() => setHoveredPillId(pill.id)}
                  onMouseLeave={() => setHoveredPillId(null)}
                  className={`group shrink-0 rounded-[6px] font-sans text-[13px] transition-[background-image,background-size,background-position,border-width,border-color] duration-200 ease-in-out ${
                    useGradientBorder ? "border border-transparent" : "border border-border/50 bg-white"
                  }`}
                  style={
                    useGradientBorder
                      ? {
                          borderWidth: active ? 1.5 : 1,
                          backgroundImage: `linear-gradient(${fillBg}, ${fillBg}), ${borderGradient}`,
                          backgroundOrigin: "padding-box, border-box",
                          backgroundClip: "padding-box, border-box",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "100% 100%, 100% 100%",
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2.5 px-3.5 py-1.5">
                    <span
                      className="flex size-4 shrink-0 rounded-full ring-1 ring-white/50 transition-transform duration-200 ease-in-out group-hover:scale-110"
                      style={{
                        background: theme.gradient,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      }}
                      aria-hidden
                    />
                    <span
                      className={active ? `font-semibold ${theme.activeTextClass ?? "text-white"}` : "font-medium"}
                    >
                      {pill.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Utility Row: Search + Filters (left), Sort (right) — same size as discovery pills */}
        <div className="mt-12 flex h-8 flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Mobile (< 768px): search icon opens full-screen search drawer */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground md:hidden"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            {/* Desktop: inline expand or expanded form */}
            {searchExpanded ? (
              <form
                onSubmit={handleSearchSubmit}
                className="hidden min-w-0 max-w-[220px] items-center gap-2 rounded-[6px] border border-border/60 bg-secondary/50 pl-3.5 pr-2 py-1.5 md:flex"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search..."
                  className="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearchExpanded(false);
                    router.push("/films");
                  }}
                  aria-label="Clear search and close"
                  className="ml-3 rounded-[6px] p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchExpanded(true)}
                aria-label="Open search"
                className="hidden h-8 w-8 items-center justify-center rounded-[6px] border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground md:inline-flex"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 rounded-[6px] border border-border/60 bg-secondary/50 px-3.5 py-1.5 font-sans text-[13px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Filters
            </button>
            <button
              type="button"
              onClick={() => setVibesDrawerOpen(true)}
              className="md:hidden inline-flex items-center justify-center gap-2.5 rounded-[6px] border border-border/60 bg-secondary/50 px-3.5 py-1.5 font-sans text-[13px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
              aria-label="Open vibes"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Vibes
            </button>
          </div>
          <div className="flex shrink-0 items-center">
            <FilmsSortBar currentSort={currentSort} />
          </div>
        </div>

        {/* Mobile only: show active vibe below search/filter buttons — same styling as desktop pill */}
        {(() => {
          const activePill = DISCOVERY_PILLS.find((p) => isPillActive(p));
          if (!activePill) return null;
          const theme = PILL_THEMES[activePill.id] ?? PILL_THEMES.experimental;
          const fillBg = theme.activeBgTint;
          const borderGradient = theme.gradient;
          return (
            <div className="mt-3 flex justify-start md:hidden">
              <button
                type="button"
                onClick={() => setDiscoveryPill(activePill, true)}
                aria-label={`Remove ${activePill.label} filter`}
                className="inline-flex shrink-0 items-center gap-1 rounded-[6px] border border-transparent font-sans text-[13px] transition-[background-image,background-size,background-position,border-width,border-color] duration-200 ease-in-out pl-3.5 pr-1.5 py-1.5 cursor-pointer hover:opacity-90"
                style={{
                  borderWidth: 1.5,
                  backgroundImage: `linear-gradient(${fillBg}, ${fillBg}), ${borderGradient}`,
                  backgroundOrigin: "padding-box, border-box",
                  backgroundClip: "padding-box, border-box",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%, 100% 100%",
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="flex size-4 shrink-0 rounded-full ring-1 ring-white/50 transition-transform duration-200 ease-in-out"
                    style={{
                      background: theme.gradient,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                    aria-hidden
                  />
                  <span className={`font-semibold ${theme.activeTextClass ?? "text-white"}`}>{activePill.label}</span>
                </span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">
                  <X className="h-3 w-3" aria-hidden />
                </span>
              </button>
            </div>
          );
        })()}
      </header>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
          {/* Filters: mobile drawer under site header (top-16), no rounded corners; desktop left drawer */}
          <div
            className="fixed left-0 right-0 top-16 z-[70] flex h-[calc(100vh-4rem)] w-full max-w-none flex-col overflow-hidden border-t border-slate-200 bg-background shadow-xl md:hidden"
            role="dialog"
            aria-label="Filters"
          >
            <div className="relative flex shrink-0 items-center justify-center border-b border-slate-200 bg-background px-4 py-3">
              <span className="font-sans text-sm font-semibold text-foreground">Filters</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterSidebar brands={brands} filterOptions={filterOptions} />
            </div>
            <div className="shrink-0 space-y-2 border-t border-slate-200 bg-background p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                disabled={
                  !searchParams.get("search") &&
                  !searchParams.get("brand") &&
                  !searchParams.get("type") &&
                  !searchParams.get("format") &&
                  !searchParams.get("grain") &&
                  !searchParams.get("contrast") &&
                  !searchParams.get("latitude") &&
                  !searchParams.get("saturation") &&
                  !searchParams.get("bestFor") &&
                  !searchParams.get("iso") &&
                  !searchParams.get("vibe")
                }
                className="w-full rounded-[6px] bg-primary px-4 py-3 font-sans text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/films");
                  setDrawerOpen(false);
                }}
                className="w-full rounded-[6px] border border-border bg-transparent px-4 py-3 font-sans text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
          <div
            className="fixed left-0 top-16 z-[70] flex hidden h-[calc(100vh-4rem)] w-full max-w-sm flex-col overflow-hidden border-r border-border bg-background shadow-xl md:flex"
            role="dialog"
            aria-label="Filters"
          >
            <div className="shrink-0 flex flex-col gap-2 border-b border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-semibold text-foreground">Filters</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <FilterSidebar brands={brands} filterOptions={filterOptions} />
            </div>
            <div className="sticky bottom-0 shrink-0 space-y-2 border-t border-slate-200 bg-background p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                disabled={
                  !searchParams.get("search") &&
                  !searchParams.get("brand") &&
                  !searchParams.get("type") &&
                  !searchParams.get("format") &&
                  !searchParams.get("grain") &&
                  !searchParams.get("contrast") &&
                  !searchParams.get("latitude") &&
                  !searchParams.get("saturation") &&
                  !searchParams.get("bestFor") &&
                  !searchParams.get("iso") &&
                  !searchParams.get("vibe")
                }
                className="w-full rounded-[6px] bg-primary px-4 py-3 font-sans text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/films");
                  setDrawerOpen(false);
                }}
                disabled={
                  !searchParams.get("search") &&
                  !searchParams.get("brand") &&
                  !searchParams.get("type") &&
                  !searchParams.get("format") &&
                  !searchParams.get("grain") &&
                  !searchParams.get("contrast") &&
                  !searchParams.get("latitude") &&
                  !searchParams.get("saturation") &&
                  !searchParams.get("bestFor") &&
                  !searchParams.get("iso") &&
                  !searchParams.get("vibe")
                }
                className="w-full rounded-[6px] border border-border bg-transparent px-4 py-3 font-sans text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile search drawer: sits below site header (top-16), only below 768px */}
      {(mobileSearchOpen || searchDrawerClosing) && (
        <>
          <div
            className="fixed top-16 left-0 right-0 bottom-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden"
            aria-hidden
            onClick={closeMobileSearchDrawer}
          />
          <div
            className={`fixed top-16 left-0 right-0 z-[70] h-[calc(100vh-4rem)] w-full overflow-hidden bg-background transition-transform duration-300 ease-out md:hidden ${
              searchDrawerReady && !searchDrawerClosing ? "translate-y-0" : "translate-y-full"
            }`}
            role="dialog"
            aria-label="Search films"
          >
            {/* Fixed header: stays in place when keyboard opens (viewport-fixed so keyboard doesn't push it) */}
            <div className="fixed left-0 right-0 top-16 z-[72] flex h-12 items-center justify-center border-b border-slate-200 bg-background px-4 md:hidden">
              <span className="font-sans text-sm font-semibold text-foreground">Search</span>
              <button
                type="button"
                onClick={closeMobileSearchDrawer}
                aria-label="Close search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Fixed search bar: stays in place when keyboard opens (below 4rem + 3rem header) */}
            <div className="fixed left-0 right-0 top-28 z-[72] shrink-0 bg-background px-4 py-3 md:hidden">
              <form onSubmit={handleMobileSearchSubmit} className="w-full" id="mobile-search-form">
                <div className="flex items-center gap-2 rounded-[8px] border border-slate-200 bg-background px-3 py-3">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    ref={mobileSearchInputRef}
                    type="search"
                    value={mobileSearchInput}
                    onChange={(e) => setMobileSearchInput(e.target.value)}
                    placeholder="Search film stocks..."
                    className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </form>
            </div>

            {/* Fixed footer: stays at bottom when keyboard opens */}
            <div className="fixed bottom-0 left-0 right-0 z-[72] space-y-2 border-t border-slate-200 bg-background p-4 md:hidden">
              <button
                type="submit"
                form="mobile-search-form"
                className="w-full rounded-[6px] bg-primary px-4 py-3 font-sans text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Search
              </button>
              <button
                type="button"
                onClick={closeMobileSearchDrawer}
                className="w-full rounded-[6px] border border-border bg-transparent px-4 py-3 font-sans text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
            </div>

            {/* Scrollable content only: BRANDS grid; fixed top/bottom so only this area scrolls when keyboard opens */}
            <div className="no-scrollbar fixed left-0 right-0 top-44 bottom-32 z-0 overflow-y-auto px-4 py-4 pb-4 md:hidden">
              <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                BRANDS
              </p>
              <div className="grid grid-cols-2 gap-2">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => handleBrandTap(brand)}
                    className="flex items-center justify-center rounded-[6px] border border-border/50 bg-secondary/30 py-3 font-sans text-[13px] font-semibold tracking-wide text-foreground transition-colors hover:border-primary/40 hover:bg-secondary active:bg-secondary/80"
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Vibes bottom drawer: mobile only, premium single-column pills */}
      {vibesDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={() => setVibesDrawerOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[7px] bg-background md:hidden"
            role="dialog"
            aria-label="Vibes"
          >
            {/* Pull-to-dismiss handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30"
                aria-hidden
              />
            </div>
            <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center border-b border-slate-100 bg-background px-4 py-3">
              <div className="min-w-0" />
              <span className="text-center font-sans text-sm font-semibold text-foreground">Vibes</span>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setVibesDrawerOpen(false)}
                  aria-label="Close vibes"
                  className="rounded-[6px] p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2">
              {DISCOVERY_PILLS.map((pill, index) => {
                const theme = PILL_THEMES[pill.id] ?? PILL_THEMES.experimental;
                const active = isPillActive(pill);
                const isFirstColumn = index % 2 === 0;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setDiscoveryPill(pill, active);
                      setTimeout(() => setVibesDrawerOpen(false), 200);
                    }}
                    className={`flex h-28 flex-col items-center justify-center gap-3 border-b border-slate-100 font-sans text-[14px] font-medium transition-colors duration-200 active:bg-slate-50 ${
                      isFirstColumn ? "border-r border-slate-100" : ""
                    } ${active ? "bg-transparent text-black" : "bg-background text-slate-700"}`}
                    style={
                      active
                        ? { backgroundColor: theme.activeBgTint10 }
                        : undefined
                    }
                  >
                    <span
                      className="flex size-4 shrink-0 rounded-full ring-1 ring-white/50 transition-transform duration-200"
                      style={{
                        background: theme.gradient,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        transform: active ? "scale(1.25)" : undefined,
                      }}
                      aria-hidden
                    />
                    <span className={active ? `font-semibold ${theme.activeTextClass ?? "text-black"}` : ""}>
                      {toSentenceCase(pill.label)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
