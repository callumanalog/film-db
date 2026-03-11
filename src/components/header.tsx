"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Menu, X, User, Plus, ListTodo, NotebookPen, ImagePlus, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const navLinks = [
  { href: "/films", label: "Film Stocks" },
  { href: "/cameras", label: "Film Cameras" },
  { href: "/labs", label: "Labs" },
  { href: "/community", label: "Community" },
];

export function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
    if (!profileMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl font-advercase">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Film className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">FilmDB</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 font-sans text-xs font-medium uppercase tracking-wider md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="relative flex items-center gap-0.5" ref={actionsRef}>
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
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-border/50 bg-card py-1 shadow-lg">
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
                  Write review
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

          <div className="relative flex items-center gap-0.5" ref={profileRef}>
            {!loading && (
              !user ? (
                <Link
                  href="/auth/sign-in?next=/profile"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Sign in
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((o) => !o)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-expanded={profileMenuOpen}
                    aria-label="Profile menu"
                  >
                    <User className="h-5 w-5" />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-border/50 bg-card py-1 shadow-lg">
                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                      >
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setProfileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
                      >
                        <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                        Sign out
                      </button>
                    </div>
                  )}
                </>
              )
            )}
          </div>

          <button
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl font-sans text-xs font-medium uppercase tracking-wider md:hidden">
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
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-md px-3 py-2.5 transition-colors",
                pathname === "/profile" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              Profile
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
