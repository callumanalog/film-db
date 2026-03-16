"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, Search, SlidersHorizontal, X, Sun, Heart, Camera, Moon, Mountain, MapPin, Sparkles, Package } from "lucide-react";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";
import { DISCOVERY_PILLS } from "@/lib/discovery-vibes";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ClearFiltersLink } from "@/components/clear-filters-link";
import { FilmsSortBar } from "@/components/films-sort-bar";
import { ActiveFilterChips } from "@/components/active-filter-chips";

type SortValue = "highest-rated" | "alphabetical";

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

/** Pastel background colors for mobile Start browsing tiles (archival aesthetic). */
const MOOD_TILE_BG: Record<string, string> = {
  essential_everyday: "bg-[#E0E7FF]",   // Soft Blue
  golden_hour: "bg-[#FFEDD5]",          // Soft Peach
  dreamy_portraits: "bg-[#FCE7F3]",     // Soft Rose
  gritty_street: "bg-[#F1F5F9]",        // Cool Grey
  cinematic_nights: "bg-[#E5E7EB]",     // Slate
  vivid_landscapes: "bg-[#DCFCE7]",     // Soft Mint
  nostalgic_travel: "bg-[#FEF3C7]",     // Soft Amber
  experimental: "bg-[#EDE9FE]",         // Soft Violet
};

/** Icon component for each mood tile peek (bottom-right). */
const MOOD_TILE_ICONS: Record<string, typeof Sun> = {
  essential_everyday: Package,
  golden_hour: Sun,
  dreamy_portraits: Heart,
  gritty_street: Camera,
  cinematic_nights: Moon,
  vivid_landscapes: Mountain,
  nostalgic_travel: MapPin,
  experimental: Sparkles,
};

/** Brand names shown in the mobile search drawer (trending brands). Order preserved. */
const TRENDING_BRAND_NAMES = ["Kodak", "CineStill", "Ilford", "Harman Technology", "Fujifilm", "Lomography"];

/** Display label overrides for trending brands in the search drawer (e.g. "Harman Technology" → "Harman"). */
const TRENDING_BRAND_DISPLAY: Record<string, string> = {
  "Harman Technology": "Harman",
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
  const [filtersVibesOpen, setFiltersVibesOpen] = useState(true);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchDrawerClosing, setSearchDrawerClosing] = useState(false);
  const [searchDrawerReady, setSearchDrawerReady] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchInput, setMobileSearchInput] = useState("");
  const defaultSearch = searchParams.get("search") ?? "";

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

  const filtersPaneOpen = searchParams.get("filters") === "1";
  const toggleFiltersPane = useCallback(() => {
    if (filtersPaneOpen) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("filters");
      const q = params.toString();
      router.push(q ? `/films?${q}` : "/films");
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("filters", "1");
      router.push(`/films?${params.toString()}`);
    }
  }, [filtersPaneOpen, router, searchParams]);

  /** Vibe page URL: /films/vibe/[id] */
  const vibeHref = (id: string) => `/films/vibe/${id}`;

  const [searchInput, setSearchInput] = useState(defaultSearch);
  const [searchExpanded, setSearchExpanded] = useState(!!defaultSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setSearchInput(defaultSearch);
    if (defaultSearch) setSearchExpanded(true);
  }, [defaultSearch]);

  /** On mobile, only show expanded bar when URL has a search term; on desktop use searchExpanded (tap or URL). */
  const showExpandedSearch = isMobile ? !!defaultSearch : searchExpanded;

  // Only auto-focus inline search on desktop; on mobile avoid opening keyboard when landing on results
  useEffect(() => {
    if (searchExpanded && !isMobile) {
      searchInputRef.current?.focus({ preventScroll: true });
    }
  }, [searchExpanded, isMobile]);

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
      mobileSearchInputRef.current?.focus({ preventScroll: true });
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
    searchInputRef.current?.blur();
    const q = searchInput.trim();
    router.push(buildUrl({ search: q || null }));
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mobileSearchInputRef.current?.blur();
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
      <header className="text-center pb-0">
        <h1 className="hidden font-sans text-3xl font-bold tracking-tight text-foreground md:block sm:text-4xl">
          Discover your next film
        </h1>
        <p className="mx-auto mt-2 hidden max-w-xl font-sans text-sm text-muted-foreground md:block sm:text-base">
          From sun-drenched portraits to gritty midnight streets—choose a mood below to find the perfect chemistry for your vision.
        </p>

        {/* Discovery Ribbon: desktop only — centered flex wrap; pills are links with always-active styling. */}
        <div className="mt-6 hidden px-4 sm:px-6 md:block">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
            {DISCOVERY_PILLS.map((pill) => {
              const theme = PILL_THEMES[pill.id] ?? PILL_THEMES.experimental;
              return (
                <Link
                  key={pill.id}
                  href={vibeHref(pill.id)}
                  className="group flex h-11 shrink-0 items-center justify-center rounded-card border border-transparent font-sans text-xs transition-[background-image,background-size,background-position] duration-200 ease-in-out"
                  style={{
                    borderWidth: 1.5,
                    backgroundImage: `linear-gradient(${theme.activeBgTint}, ${theme.activeBgTint}), ${theme.gradient}`,
                    backgroundOrigin: "padding-box, border-box",
                    backgroundClip: "padding-box, border-box",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%, 100% 100%",
                  }}
                >
                  <h3 className={`m-0 font-sans text-sm font-semibold px-4 ${theme.activeTextClass ?? "text-white"}`}>
                    {pill.label}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile: "Browse by use case" + 2x2 grid of pills (links, always-active styling). */}
        <div className="mt-3 md:hidden">
          <h3 className="mb-2 text-left font-sans text-xl font-bold tracking-tight text-foreground">
            Browse by use case
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {DISCOVERY_PILLS.map((pill) => {
              const theme = PILL_THEMES[pill.id] ?? PILL_THEMES.experimental;
              return (
                <Link
                  key={pill.id}
                  href={vibeHref(pill.id)}
                  className="group flex h-11 w-full items-center justify-start rounded-card border border-transparent font-sans text-xs transition-[background-image,background-size,background-position] duration-200 ease-in-out"
                  style={{
                    borderWidth: 1.5,
                    backgroundImage: `linear-gradient(${theme.activeBgTint}, ${theme.activeBgTint}), ${theme.gradient}`,
                    backgroundOrigin: "padding-box, border-box",
                    backgroundClip: "padding-box, border-box",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%, 100% 100%",
                  }}
                >
                  <h3 className={`m-0 font-sans text-sm font-semibold pl-4 pr-4 ${theme.activeTextClass ?? "text-white"}`}>
                    {pill.label}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Utility Row: Mobile = nothing (search in header). Desktop = search icon/form + Filters + Sort. */}
        <div className="mt-0 flex flex-row flex-wrap items-center justify-between gap-4 md:mt-12">
          {isMobile ? (
            /* Mobile: search is in site header; no Filters/Sort row */
            null
          ) : (
            <div className="hidden md:flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {showExpandedSearch ? (
                  <form
                    role="search"
                    onSubmit={handleSearchSubmit}
                    className="flex h-[36px] min-w-0 basis-full items-center gap-2 rounded-card border border-border/60 bg-secondary/50 pl-4 pr-2 md:basis-auto md:max-w-[var(--width-search-field)]"
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      inputMode="search"
                      enterKeyHint="search"
                      autoComplete="off"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search..."
                      className="min-w-0 flex-1 border-0 bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearchExpanded(false);
                        router.push("/films");
                      }}
                      aria-label="Clear search and close"
                      className="rounded-card p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchExpanded(true)}
                    aria-label="Open search"
                    className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-card border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFiltersPane}
                  aria-label={filtersPaneOpen ? "Close filters" : "Open filters"}
                  className={`h-[36px] shrink-0 items-center justify-center gap-2 rounded-card border px-4 font-sans text-xs font-medium transition-colors inline-flex ${
                    filtersPaneOpen
                      ? "border-primary/60 bg-primary/10 text-foreground hover:bg-primary/15"
                      : "border-border/60 bg-secondary/50 text-foreground hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Filters
                </button>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ActiveFilterChips brands={brands} />
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <FilmsSortBar currentSort={currentSort} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile only: filter chips (no discovery-pill chip). */}
        <div className="mt-3 flex flex-wrap items-center justify-start gap-1.5 md:hidden">
          <ActiveFilterChips brands={brands} />
        </div>
      </header>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
          {/* Filters: mobile drawer — full height from below header to viewport bottom (100dvh for mobile chrome). */}
          <div
            className="fixed inset-x-0 top-16 z-[70] flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] flex-col overflow-hidden border-t border-border bg-background shadow-xl md:hidden"
            role="dialog"
            aria-label="Filters"
          >
            <header className="flex h-16 shrink-0 items-center justify-end border-b border-border bg-white relative">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 pt-4 pb-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Vibes: first category in filter drawer on mobile, default open, same pill style with gradient circle */}
              <div className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setFiltersVibesOpen((o) => !o)}
                  className="label-caps flex w-full items-center justify-between gap-2 py-4 text-left hover:text-foreground"
                  aria-expanded={filtersVibesOpen}
                >
                  <span>Vibes</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${filtersVibesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {filtersVibesOpen && (
                  <div className="grid grid-cols-2 gap-2 pb-4">
                    {DISCOVERY_PILLS.map((pill) => {
                      const theme = PILL_THEMES[pill.id] ?? PILL_THEMES.experimental;
                      return (
                        <Link
                          key={pill.id}
                          href={vibeHref(pill.id)}
                          onClick={() => setDrawerOpen(false)}
                          className="inline-flex h-11 min-w-0 items-center justify-center rounded-[6px] border border-primary bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                        >
                          <h3 className="m-0 truncate font-sans text-xs font-medium text-primary">{pill.label}</h3>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              <FilterSidebar brands={brands} filterOptions={filterOptions} typeDefaultOpen={false} />
            </div>
            <div className="shrink-0 border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="space-y-2">
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
                  className="btn-primary"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/films");
                    setDrawerOpen(false);
                  }}
                  className="w-full py-2 text-center font-sans text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile search drawer: max-h-[90dvh], sticky header + action bar */}
      {(mobileSearchOpen || searchDrawerClosing) && (
        <>
          <div
            className="fixed top-16 left-0 right-0 bottom-0 z-[60] bg-black/20 transition-opacity duration-300 md:hidden"
            aria-hidden
            onClick={closeMobileSearchDrawer}
          />
          <div
            className={`fixed inset-x-0 top-16 z-[70] flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-background transition-transform duration-300 ease-out md:hidden ${
              searchDrawerReady && !searchDrawerClosing ? "translate-y-0" : "translate-y-full"
            }`}
            role="dialog"
            aria-label="Search films"
          >
            <div className="flex shrink-0 items-center gap-2 bg-white px-4 py-3">
              <button
                type="button"
                onClick={closeMobileSearchDrawer}
                aria-label="Close search"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <form role="search" onSubmit={handleMobileSearchSubmit} className="min-w-0 flex-1" id="mobile-search-form">
                <div className="flex h-[52px] items-center gap-2 rounded-card border border-border bg-background px-4">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    ref={mobileSearchInputRef}
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    value={mobileSearchInput}
                    onChange={(e) => setMobileSearchInput(e.target.value)}
                    placeholder="Search film stocks..."
                    className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSearchInput("");
                      router.push("/films");
                    }}
                    aria-label="Clear search"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex-1 overflow-hidden bg-white px-4 pt-4">
              <p className="label-caps mb-3">Trending brands</p>
              <div className="grid grid-cols-2 gap-2">
                {brands
                  .filter((b) => TRENDING_BRAND_NAMES.includes(b.name))
                  .sort((a, b) => TRENDING_BRAND_NAMES.indexOf(a.name) - TRENDING_BRAND_NAMES.indexOf(b.name))
                  .map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => handleBrandTap(brand)}
                      className="flex h-[44px] items-center justify-center rounded-card border border-border/50 bg-secondary/30 px-4 font-sans text-sm font-semibold tracking-wide text-foreground transition-colors hover:border-primary/40 hover:bg-secondary active:bg-secondary/80"
                    >
                      {TRENDING_BRAND_DISPLAY[brand.name] ?? brand.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Vibes bottom drawer: mobile only, max-h-[90dvh], sticky header */}
      {vibesDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            aria-hidden
            onClick={() => setVibesDrawerOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 flex h-[90dvh] max-h-[90dvh] flex-col overflow-hidden rounded-t-card bg-background md:hidden"
            role="dialog"
            aria-label="Vibes"
          >
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
            </div>
            <header className="flex h-16 shrink-0 items-center justify-center border-b border-border bg-white relative">
              <h2 className="text-center font-sans text-sm font-semibold text-foreground">Vibes</h2>
              <button
                type="button"
                onClick={() => setVibesDrawerOpen(false)}
                aria-label="Close vibes"
                className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-2">
              {DISCOVERY_PILLS.map((pill, index) => {
                const theme = PILL_THEMES[pill.id] ?? PILL_THEMES.experimental;
                const isFirstColumn = index % 2 === 0;
                return (
                  <Link
                    key={pill.id}
                    href={vibeHref(pill.id)}
                    onClick={() => setTimeout(() => setVibesDrawerOpen(false), 200)}
                    className={`flex h-11 items-center justify-center border-b border-border font-sans text-sm font-medium transition-colors duration-200 active:bg-muted ${
                      isFirstColumn ? "border-r border-slate-100" : ""
                    } bg-transparent text-black`}
                    style={{ backgroundColor: theme.activeBgTint10 }}
                  >
                    <h3 className={`m-0 font-sans text-sm font-semibold ${theme.activeTextClass ?? "text-black"}`}>
                      {toSentenceCase(pill.label)}
                    </h3>
                  </Link>
                );
              })}
            </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
