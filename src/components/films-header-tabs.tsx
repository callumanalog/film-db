"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const FILMS_TABS = [
  { id: "stocks", label: "Stocks" },
  { id: "shots", label: "Shots" },
  { id: "notes", label: "Notes" },
  { id: "brands", label: "Brands" },
  { id: "users", label: "Users" },
] as const;

function buildHref(tabId: string, searchParams: URLSearchParams): string {
  const hasSearch = searchParams.has("search");
  if (!hasSearch) {
    if (tabId === "brands") return "/brands";
    if (tabId === "users") return "/community";
  }
  const params = new URLSearchParams(searchParams.toString());
  if (tabId === "stocks") params.delete("tab");
  else params.set("tab", tabId);
  const q = params.toString();
  return q ? `/films?${q}` : "/films";
}

export function FilmsHeaderTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const activeId =
    pathname === "/brands"
      ? "brands"
      : pathname === "/community"
        ? "users"
        : pathname === "/films"
          ? (tabParam === "shots" ? "shots" : tabParam === "notes" ? "notes" : tabParam === "brands" ? "brands" : tabParam === "users" ? "users" : "stocks")
          : "stocks";

  return (
    <nav className="border-b border-border/50" aria-label="Section tabs">
      <div className="flex gap-6">
        {FILMS_TABS.map((t) => {
          const isActive = t.id === activeId;
          const href = buildHref(t.id, searchParams);
          return (
            <Link
              key={t.id}
              href={href}
              className={`relative pb-3 pt-1 text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground" aria-hidden />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
