"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Refrigerator, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/films", label: "Library", icon: Search },
  { href: "/vault", label: "The Vault", icon: Refrigerator },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] min-h-[64px] items-center justify-around border-t border-slate-100 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Bottom navigation"
      style={{ minHeight: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/" && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-center rounded-lg p-3 transition-transform active:scale-110",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
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
