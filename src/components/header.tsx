"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Menu, X, UserRound, Plus, NotebookPen, ImagePlus, ListPlus, LogOut, MoreHorizontal, ChevronLeft, Share2, Settings2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";
import { buttonVariants } from "@/components/ui/button";
import { FilmsHeaderSearch } from "@/components/films-header-search";

const GlobalSearchOverlay = dynamic(
  () => import("@/components/global-search-overlay").then((m) => ({ default: m.GlobalSearchOverlay })),
  { ssr: false }
);

const navLinks = [
  { href: "/community", label: "Community" },
  { href: "/films", label: "Film Stocks" },
  { href: "/cameras", label: "Film Cameras" },
  { href: "/labs", label: "Labs" },
];

/** First N links stay visible on medium desktop; rest go in "More" dropdown */
const PRIORITY_NAV_COUNT = 2;
const priorityNavLinks = navLinks.slice(0, PRIORITY_NAV_COUNT);
const moreNavLinks = navLinks.slice(PRIORITY_NAV_COUNT);

const MAIN_LANDING_PATHS = ["/", "/films", "/search", "/profile"];

/** Height of the integrated film hero header when scroll is 0 (mobile). */
const EXPANDED_HERO_HEIGHT = 52;
/** Height of the sticky nav bar when scrolled past the hero. */
const COLLAPSED_NAV_HEIGHT = 52;
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { mobileHeaderTitle, mobileHeroMeta } = useMobileHeaderTitle() ?? {};
  const isAuthPage = pathname?.startsWith("/auth/sign-in") || pathname?.startsWith("/auth/sign-up");
  const showBack = pathname != null && !MAIN_LANDING_PATHS.includes(pathname);
  const isFilmHero = showBack && mobileHeaderTitle != null;
  const isFilmsPage = pathname === "/films";
  const isSearchPage = pathname === "/search";
  const isProfilePage = pathname === "/profile" || pathname?.startsWith("/profile/");
  const searchParams = useSearchParams();
  const filmsViewTab = searchParams.get("tab") === "index" ? "index" : "for-you";
  /** On films mobile, show 🔍 in nav (no inline search bar on either tab). */
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFilmHero && !isFilmsPage) return;
    const onScroll = () => setScrollY(typeof window !== "undefined" ? window.scrollY : 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isFilmHero, isFilmsPage]);

  useEffect(() => {
    if (!actionsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionsOpen]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!settingsMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsMenuOpen]);

  const heroHeight = Math.max(COLLAPSED_NAV_HEIGHT, EXPANDED_HERO_HEIGHT - scrollY);
  const heroPast = scrollY >= EXPANDED_HERO_HEIGHT;
  const borderOpacity = heroPast ? 1 : Math.min(1, scrollY / Math.max(1, EXPANDED_HERO_HEIGHT));
  const h1Scale = Math.max(0.6, 1 - (scrollY / Math.max(1, EXPANDED_HERO_HEIGHT)) * 0.4);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 font-sans transition-[background-color,border-color] duration-200",
        isFilmsPage
          ? "bg-background"
          : isFilmHero
            ? "border-0 bg-white md:border-b md:border-border/50 md:bg-background/80 md:backdrop-blur-xl"
            : "border-b border-border/50 bg-background/80 backdrop-blur-xl"
      )}
      style={
        isFilmHero
          ? {
              paddingTop: heroPast
                ? "env(safe-area-inset-top, 0px)"
                : "calc(env(safe-area-inset-top, 0px) + 20px)",
              paddingBottom: undefined,
              borderBottomWidth: 1,
              borderBottomStyle: "solid",
              borderBottomColor: `rgba(241, 245, 249, ${borderOpacity})`,
            }
          : undefined
      }
    >
      {/* Film hero integrated header: mobile only — flex row, icons aligned to first line of title */}
      {isFilmHero && (
        <div
          className={cn(
            "flex w-full justify-between px-4 md:hidden",
            heroPast ? "items-center" : "items-start"
          )}
          style={{ minHeight: heroPast ? COLLAPSED_NAV_HEIGHT : heroHeight }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Go back"
            style={{ marginTop: heroPast ? 0 : "-4px" }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
            <span
              className={cn(
                "mx-auto max-w-[70%] tracking-tight transition-[transform,font-size] duration-200",
                heroPast ? "font-sans text-lg font-bold" : "font-sans text-3xl font-bold"
              )}
              style={
                heroPast
                  ? undefined
                  : { transform: `scale(${h1Scale})`, transformOrigin: "center center" }
              }
            >
              {mobileHeaderTitle}
            </span>
            {scrollY < EXPANDED_HERO_HEIGHT && mobileHeroMeta != null && mobileHeroMeta !== "" && (
              <p className="mt-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {mobileHeroMeta}
              </p>
            )}
          </div>
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Share"
            style={{ marginTop: heroPast ? 0 : "-4px" }}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Search page: search bar lives in SearchConsole on the page, not in header */}

      {/* Top nav: 3-column (logo center, nav left, profile right). Hidden on search mobile (single-column layout used). */}
      <div
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-3 items-center px-4 sm:px-6 lg:grid-cols-[1fr_1fr_1fr] lg:px-8",
          isFilmHero ? "hidden md:grid h-16" : "grid h-16",
          isSearchPage && "hidden md:grid"
        )}
      >
        <div className="flex min-w-0 items-center justify-start overflow-hidden gap-1">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <>
              <button
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hidden md:flex lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              {/* Desktop nav: lg–xl = 2 priority links + More; xl+ = all links */}
              <nav className="hidden items-center gap-1 overflow-hidden text-sm font-medium lg:flex">
            {/* Priority links: visible from lg to xl */}
            {priorityNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 whitespace-nowrap transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {/* Remaining links: visible only from xl */}
            {moreNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "hidden shrink-0 rounded-md px-3 py-2 whitespace-nowrap transition-colors xl:inline-block",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* More dropdown: visible from lg to xl only (excluded on mobile; mobile uses hamburger) */}
          <div className="relative hidden lg:block xl:hidden" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((o) => !o)}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-expanded={moreMenuOpen}
              aria-haspopup="true"
              aria-label="More navigation"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {moreMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-card border border-border bg-card py-1 shadow-md">
                {moreNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      "block whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                      pathname === link.href || pathname.startsWith(link.href + "/")
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {user && (
            <div className="relative hidden items-center gap-0.5 lg:flex" ref={actionsRef}>
              <button
                type="button"
                onClick={() => setActionsOpen((o) => !o)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-expanded={actionsOpen}
                aria-haspopup="true"
                aria-label="Add — track, review, or upload"
              >
                <Plus className="h-5 w-5" />
              </button>
              {actionsOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-card border border-border/50 bg-card py-1 shadow-lg">
                  <Link
                    href="/films"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <NotebookPen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Add a review
                  </Link>
                  <Link
                    href="/films"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Add shots
                  </Link>
                  <Link
                    href="/films"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <ListPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Create a list
                  </Link>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>

        {/* Center column: logo (exposure club / mobile stock name). Search page mobile uses single-column block above. */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <Link
            href="/"
            className="hidden whitespace-nowrap text-2xl font-bold tracking-tight transition-opacity hover:opacity-80 md:inline-block font-young-serif"
          >
            exposure club
          </Link>
          {!isSearchPage && (
            <Link
              href={mobileHeaderTitle && pathname ? pathname : "/"}
              className={`whitespace-nowrap font-bold tracking-tight transition-opacity hover:opacity-80 md:hidden ${mobileHeaderTitle ? "text-lg font-sans" : "text-2xl font-young-serif"}`}
            >
              {mobileHeaderTitle ?? "exposure club"}
            </Link>
          )}
        </div>

        {/* Right column: Share when back; on profile, settings icon; else profile / sign-in */}
        <div className="flex items-center justify-end gap-2">
          {isProfilePage && (
            <div className="relative" ref={settingsMenuRef}>
              <button
                type="button"
                onClick={() => setSettingsMenuOpen((o) => !o)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Settings"
                aria-expanded={settingsMenuOpen}
                aria-haspopup="true"
              >
                <Settings2 className="h-5 w-5" />
              </button>
              {settingsMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-card border border-border/50 bg-card py-1 shadow-lg">
                  <Link
                    href="/profile/settings"
                    onClick={() => setSettingsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setSettingsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
          {showBack && (
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}
          {!showBack && !loading && !user && !isAuthPage && (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/auth/sign-in?next=/profile"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "default" }),
                    "shrink-0 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className={cn(buttonVariants({ variant: "secondary", size: "default" }), "shrink-0 text-sm font-medium")}
                >
                  Create account
                </Link>
              </div>
            </>
          )}
          {!showBack && !loading && user && (
            <Link
              href="/profile"
              className="hidden h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
              aria-label="Profile"
            >
              {(user.user_metadata?.avatar_url as string) ? (
                <Image
                  src={user.user_metadata.avatar_url as string}
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-sm font-semibold">
                  {(user.user_metadata?.display_name as string)?.charAt(0) ||
                    (user.user_metadata?.full_name as string)?.charAt(0) ||
                    user.email?.charAt(0)?.toUpperCase() ||
                    "?"}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>


      <GlobalSearchOverlay
        open={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        closeOnSubmit
      />

      {/* Mobile drawer: md–lg only (hidden on small mobile where bottom nav is shown) */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl text-sm font-medium hidden md:block lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {!loading && !user && !isAuthPage && (
              <div className="md:hidden">
                <Link
                  href="/auth/sign-in?next=/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  Log in
                </Link>
                <div className="pt-1">
                  <Link
                    href="/auth/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex w-full justify-center")}
                  >
                    Create account
                  </Link>
                </div>
              </div>
            )}
            {!loading && user && (
              <>
                <div className="my-1 border-t border-border/50" />
                <Link
                  href="/films"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <NotebookPen className="h-4 w-4 shrink-0" />
                  Add a review
                </Link>
                <Link
                  href="/films"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <ImagePlus className="h-4 w-4 shrink-0" />
                  Add shots
                </Link>
                <Link
                  href="/films"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <ListPlus className="h-4 w-4 shrink-0" />
                  Create a list
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
