"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { preload } from "swr";
import { Home, GalleryHorizontalEnd, Plus, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { isStockListFormEditorPath } from "@/lib/stock-list-form-route";
import { openPlusActionSheet } from "@/components/plus-action-sheet";
import { searchPageDataKey } from "@/lib/nav-cache-swr";
import { getSearchPageData } from "@/app/actions/nav-cache";

const LEFT_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Discover", icon: GalleryHorizontalEnd },
] as const;

const RIGHT_ITEMS = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function getFilmSlug(pathname: string | null): string | null {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "films" && parts.length >= 2 && !["images"].includes(parts[parts.length - 1])) {
    return parts[1];
  }
  return null;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getActiveHref(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname === "/" || pathname.startsWith("/films/")) return "/";
  if (pathname === "/explore" || pathname.startsWith("/explore/")) return "/explore";
  if (pathname === "/search" || pathname.startsWith("/search")) return "/search";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "/profile";
  return null;
}

const ICON_LINK_CLASS =
  "flex items-center justify-center rounded-lg p-3 transition-transform duration-150 ease-out active:scale-95 touch-manipulation";

/** Input types that typically open a text/numeric keyboard — hide bottom nav while focused (iOS / browsers that still lift fixed bars). */
const INPUT_TYPES_IGNORE_FOCUS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function isKeyboardFocusTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  if (tag !== "INPUT") return false;
  const type = (el as HTMLInputElement).type?.toLowerCase() ?? "text";
  return !INPUT_TYPES_IGNORE_FOCUS.has(type);
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [hideForKeyboard, setHideForKeyboard] = useState(false);
  const resolvedActive = getActiveHref(pathname);
  const activeHref = pendingPath ?? resolvedActive;

  useEffect(() => {
    if (pendingPath != null && resolvedActive === pendingPath) {
      setPendingPath(null);
    }
  }, [pendingPath, resolvedActive]);

  useEffect(() => {
    let blurTimer: ReturnType<typeof setTimeout> | undefined;

    const syncHidden = () => {
      setHideForKeyboard(isKeyboardFocusTarget(document.activeElement));
    };

    const onFocusIn = (e: FocusEvent) => {
      if (isKeyboardFocusTarget(e.target)) setHideForKeyboard(true);
    };

    const onFocusOut = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(syncHidden, 0);
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      clearTimeout(blurTimer);
    };
  }, []);

  const handlePlus = () => {
    const filmSlug = getFilmSlug(pathname);
    if (filmSlug) {
      openPlusActionSheet({ filmSlug, filmName: slugToName(filmSlug) });
    } else {
      openPlusActionSheet();
    }
  };

  const handleNavPointerDown = (e: React.PointerEvent, href: string) => {
    if (e.button !== 0) return;
    setPendingPath(href);
    e.preventDefault();
    router.push(href);
  };

  if (isStockListFormEditorPath(pathname)) {
    return null;
  }

  return (
    <nav
      className={cn(
        "capacitor-safe-bottom fixed bottom-0 left-0 right-0 z-50 flex h-[72px] min-h-[64px] items-center justify-around border-t border-slate-100 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] transition-opacity duration-150 md:hidden",
        hideForKeyboard && "pointer-events-none invisible opacity-0"
      )}
      aria-label="Bottom navigation"
      aria-hidden={hideForKeyboard}
      style={{ minHeight: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
    >
      {LEFT_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        const onPrefetch = undefined;
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
        onClick={handlePlus}
        aria-label="Add"
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
