"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "for-you", label: "FOR YOU", href: "/films" },
  { id: "index", label: "INDEX", href: "/films?tab=index" },
] as const;

export function FilmsViewTabs() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeId = tabParam === "index" ? "index" : "for-you";

  return (
    <div className="flex w-full border-b border-slate-200 bg-background">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "flex flex-1 items-center justify-center py-3 text-sm font-medium transition-colors",
            activeId === tab.id
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
