"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { preload } from "swr";
import { Home, GalleryHorizontalEnd, Plus, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogRollTrigger } from "@/context/log-roll-trigger-context";
import { openLogRollChoiceDrawer } from "@/components/log-roll-choice-drawer";
import { searchPageDataKey, filmsPageDataKey } from "@/lib/nav-cache-swr";
import { getSearchPageData, getFilmsPageData } from "@/app/actions/nav-cache";

const LEFT_ITEMS = [
  { href: "/films", label: "Home", icon: Home },
  { href: "/", label: "Discover", icon: GalleryHorizontalEnd },
] as const;

const RIGHT_ITEMS = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

/** True when pathname is a film stock detail page, e.g. /films/kodak-gold-200 */
function isFilmDetailPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "films" && parts.length >= 2;
}

/** Single active nav destination: /, /films, /search, or /profile. Film detail pages count as /films. */
function getActiveHref(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname === "/") return "/";
  if (pathname === "/films" || pathname.startsWith("/films/")) return "/films";
  if (pathname === "/search" || pathname.startsWith("/search")) return "/search";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "/profile";
  return null;
}

const ICON_LINK_CLASS =
  "flex items-center justify-center rounded-lg p-3 transition-transform duration-150 ease-out active:scale-95 touch-manipulation";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const trigger = useLogRollTrigger();
  const onFilmPage = isFilmDetailPath(pathname);

  /** Optimistic: highlight the tapped icon immediately (<50ms) before pathname updates. */
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const resolvedActive = getActiveHref(pathname);
  const activeHref = pendingPath ?? resolvedActive;

  useEffect(() => {
    if (pendingPath != null && resolvedActive === pendingPath) {
      setPendingPath(null);
    }
  }, [pendingPath, resolvedActive]);

  const handlePlus = () => {
    if (onFilmPage && trigger) {
      trigger.openLogRoll();
    } else {
      openLogRollChoiceDrawer();
    }
  };

  const handleNavPointerDown = (e: React.PointerEvent, href: string) => {
    if (e.button !== 0) return;
    setPendingPath(href);
    e.preventDefault();
    router.push(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] min-h-[64px] items-center justify-around border-t border-slate-100 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Bottom navigation"
      style={{ minHeight: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
    >
      {LEFT_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        const onPrefetch = href === "/films" ? () => preload(filmsPageDataKey({}), () => getFilmsPageData({})) : undefined;
        return (
          <Link
            key={href}
            href={href}
            onMouseEnter={onPrefetch}
            onPointerDown={(e) => handleNavPointerDown(e, href)}
            className={cn(
              ICON_LINK_CLASS,
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
          >
            <Icon className="h-6 w-6 shrink-0" aria-hidden />
          </Link>
        );
      })}
      <button
        type="button"
        onClick={(e) => {
          if ((e as React.MouseEvent).detail === 0) handlePlus();
        }}
        onPointerDown={(e) => {
          if (e.button === 0) {
            e.preventDefault();
            handlePlus();
          }
        }}
        aria-label="Log a roll"
        className={cn(ICON_LINK_CLASS, "text-muted-foreground hover:text-foreground")}
      >
        <Plus className="h-6 w-6 shrink-0" aria-hidden />
      </button>
      {RIGHT_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        const onPrefetch = href === "/search" ? () => preload(searchPageDataKey({}), () => getSearchPageData({})) : undefined;
        return (
          <Link
            key={href}
            href={href}
            onMouseEnter={onPrefetch}
            onPointerDown={(e) => handleNavPointerDown(e, href)}
            className={cn(
              ICON_LINK_CLASS,
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
          >
            <Icon className="h-6 w-6 shrink-0" aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}
