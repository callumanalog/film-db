"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Menu, X, UserRound, Plus, NotebookPen, ImagePlus, ListPlus, LogOut, MoreHorizontal, ChevronLeft, Share2, Settings2, Check, CircleCheck } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";
import { useUserActions } from "@/context/user-actions-context";
import { showToastViaEvent } from "@/components/toast";
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

const COLLAPSED_NAV_HEIGHT = 52;

/** ~px per character for `text-base font-semibold` in the film header (mixed case); used only for a coarse max-length. */
const FILM_HEADER_PX_PER_CHAR = 9.1;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { mobileHeaderTitle, mobileHeroMeta, titleScrolledPast, filmSlug } = useMobileHeaderTitle() ?? {};
  const { shotSlugs, toggleShot } = useUserActions();
  const filmDetailIsShot = filmSlug != null && shotSlugs.includes(filmSlug);
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const filmHeroRightActionPx = (filmSlug != null ? 44 : 0) + 44;
  const filmHeroTitlePadLeftPx = 44 + 4;
  const filmHeroTitlePadRightPx = filmHeroRightActionPx + 4;
  /** Same inset both sides so the title band is viewport-centred (asymmetric chrome would skew text-center). */
  const filmHeroTitleSymmetricPadPx = Math.max(filmHeroTitlePadLeftPx, filmHeroTitlePadRightPx);

  const [filmHeroTitleMaxChars, setFilmHeroTitleMaxChars] = useState(28);

  useEffect(() => {
    if (!isFilmHero) return;
    const compute = () => {
      const rowInnerPx = window.innerWidth;
      const avail = Math.max(64, rowInnerPx - 2 * filmHeroTitleSymmetricPadPx);
      setFilmHeroTitleMaxChars(Math.max(12, Math.floor(avail / FILM_HEADER_PX_PER_CHAR)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isFilmHero, filmHeroTitleSymmetricPadPx]);

  const filmHeroDisplayTitle = useMemo(() => {
    if (!mobileHeaderTitle) return "";
    if (mobileHeaderTitle.length <= filmHeroTitleMaxChars) return mobileHeaderTitle;
    const cut = Math.max(1, filmHeroTitleMaxChars - 1);
    return `${mobileHeaderTitle.slice(0, cut)}…`;
  }, [mobileHeaderTitle, filmHeroTitleMaxChars]);

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


  return (
    <header
      className={cn(
        "sticky top-0 z-50 font-sans transition-[background-color,border-color,backdrop-filter] duration-200",
        isFilmsPage
          ? "bg-background"
          : isFilmHero
            ? cn(
                "bg-white",
                "md:border-b md:border-border/50 md:bg-background/80 md:backdrop-blur-xl"
              )
            : "border-b border-border/50 bg-background/80 backdrop-blur-xl"
      )}
      style={
        isFilmHero
          ? { paddingTop: "env(safe-area-inset-top, 0px)" }
          : undefined
      }
    >
      {/* Film hero integrated header: mobile only — compact title appears when in-page title scrolls out of view */}
      {isFilmHero && (
        <div
          className={cn(
            "relative flex w-full items-center justify-between px-0 md:hidden",
            titleScrolledPast && "border-b border-border/50"
          )}
          style={{ minHeight: COLLAPSED_NAV_HEIGHT }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="relative z-10 flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {/* Symmetric horizontal inset so truncated title stays visually centre-aligned in the nav. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 right-0 z-0 flex min-w-0 items-center justify-center overflow-hidden"
            style={{
              paddingLeft: filmHeroTitleSymmetricPadPx,
              paddingRight: filmHeroTitleSymmetricPadPx,
            }}
            aria-hidden={!titleScrolledPast}
          >
            <span
              className={cn(
                "block min-w-0 w-full truncate text-center font-sans text-base font-semibold tracking-tight transition-opacity duration-200",
                titleScrolledPast ? "opacity-100 text-foreground" : "opacity-0"
              )}
              title={
                mobileHeaderTitle != null && filmHeroDisplayTitle !== mobileHeaderTitle
                  ? mobileHeaderTitle
                  : undefined
              }
            >
              {filmHeroDisplayTitle}
            </span>
          </div>
          <div className="relative z-10 flex flex-shrink-0 items-center">
            {filmSlug != null && (
              <button
                type="button"
                onClick={() => {
                  if (filmDetailIsShot) {
                    toggleShot(filmSlug);
                    showToastViaEvent("Removed from stocks you've shot");
                  } else {
                    toggleShot(filmSlug);
                    showToastViaEvent("Marked as shot");
                  }
                }}
                className="group flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
                aria-label={filmDetailIsShot ? "Remove from stocks you've shot" : "Mark as shot"}
              >
                {filmDetailIsShot ? (
                  <span
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary"
                    aria-hidden
                  >
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </span>
                ) : (
                  <CircleCheck
                    className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("film-detail-more"))}
              className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
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
            className="hidden whitespace-nowrap text-2xl font-extrabold tracking-tight transition-opacity hover:opacity-80 md:inline-block font-cabinet"
          >
            exposure club
          </Link>
          {!isSearchPage && (
            <Link
              href={mobileHeaderTitle && pathname ? pathname : "/"}
              className={`whitespace-nowrap font-extrabold tracking-tight transition-opacity hover:opacity-80 md:hidden ${mobileHeaderTitle ? "text-lg font-sans" : "text-2xl font-cabinet"}`}
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
