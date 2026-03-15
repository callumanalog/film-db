"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, UserRound, Plus, ListTodo, NotebookPen, ImagePlus, LogOut, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { buttonVariants } from "@/components/ui/button";

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

export function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const isAuthPage = pathname?.startsWith("/auth/sign-in") || pathname?.startsWith("/auth/sign-up");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl font-sans">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-4 sm:px-6 lg:grid-cols-[1fr_1fr_1fr] lg:px-8">
        {/* Left column: on < lg = hamburger only. on lg = nav + Add. Flex + overflow-hidden to avoid wrap. */}
        <div className="flex min-w-0 items-center justify-start overflow-hidden gap-1">
          <button
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
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
                    <ListTodo className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Track a roll
                  </Link>
                  <Link
                    href="/films"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <NotebookPen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Add Shooting Notes
                  </Link>
                  <Link
                    href="/films"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Upload images
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center column: logo — centred on mobile and desktop */}
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="whitespace-nowrap text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            FilmDB
          </Link>
        </div>

        {/* Right column: on mobile (<768px) show profile icon → sign-in; on desktop show Log in + Create account or avatar */}
        <div className="flex items-center justify-end gap-2">
          {!loading && !user && !isAuthPage && (
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
              <Link
                href="/auth/sign-in?next=/profile"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
                aria-label="Log in"
              >
                <UserRound className="h-5 w-5" />
              </Link>
            </>
          )}
          {!loading && user && (
            <Link
              href="/profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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

      {/* Mobile drawer: < 1024px — all nav links + Log in + Join (or Add actions + Profile + Sign out) */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl text-sm font-medium lg:hidden">
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
                  <ListTodo className="h-4 w-4 shrink-0" />
                  Track a roll
                </Link>
                <Link
                  href="/films"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <NotebookPen className="h-4 w-4 shrink-0" />
                  Add Shooting Notes
                </Link>
                <Link
                  href="/films"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <ImagePlus className="h-4 w-4 shrink-0" />
                  Upload images
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
