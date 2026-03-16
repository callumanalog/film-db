"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GalleryHorizontalEnd, Plus, Refrigerator, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogRollTrigger } from "@/context/log-roll-trigger-context";

const LEFT_ITEMS = [
  { href: "/films", label: "Home", icon: Home },
  { href: "/", label: "Library", icon: GalleryHorizontalEnd },
] as const;

const RIGHT_ITEMS = [
  { href: "/vault", label: "The Vault", icon: Refrigerator },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

/** True when pathname is a film stock detail page, e.g. /films/kodak-gold-200 */
function isFilmDetailPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "films" && parts.length >= 2;
}

/** Single active nav destination: /, /films, /vault, or /profile. Film detail pages count as /films (Library). */
function getActiveHref(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname === "/") return "/";
  if (pathname === "/films" || pathname.startsWith("/films/")) return "/films";
  if (pathname === "/vault" || pathname.startsWith("/vault/")) return "/vault";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "/profile";
  return null;
}

export function BottomNav() {
  const pathname = usePathname();
  const trigger = useLogRollTrigger();
  const onFilmPage = isFilmDetailPath(pathname);
  const activeHref = getActiveHref(pathname);
  const handlePlus = () => {
    if (onFilmPage && trigger) trigger.openLogRoll();
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] min-h-[64px] items-center justify-around border-t border-slate-100 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Bottom navigation"
      style={{ minHeight: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
    >
      {LEFT_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-center rounded-lg p-3 transition-transform active:scale-110",
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
        onClick={handlePlus}
        aria-label="Log a roll"
        className="flex items-center justify-center rounded-lg p-3 text-muted-foreground transition-transform hover:text-foreground active:scale-110"
      >
        <Plus className="h-6 w-6 shrink-0" aria-hidden />
      </button>
      {RIGHT_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-center rounded-lg p-3 transition-transform active:scale-110",
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
