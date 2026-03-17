"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Barcode, ChevronRight } from "lucide-react";
import { searchFilmsByTab, type SearchStocksResult } from "@/app/actions/search";

const EVENT_OPEN = "openLogRollChoiceDrawer";

export function LogRollChoiceDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choice" | "search">("choice");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchStocksResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setStep("choice");
      setSearchQuery("");
      setSearchResults(null);
      setOpen(true);
    };
    window.addEventListener(EVENT_OPEN, handleOpen);
    return () => window.removeEventListener(EVENT_OPEN, handleOpen);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setStep("choice");
        setSearchQuery("");
        setSearchResults(null);
      }
      setOpen(next);
    },
    []
  );

  useEffect(() => {
    if (step !== "search") return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    searchFilmsByTab(q, "stocks").then((res) => {
      if (!cancelled) {
        setSearchResults(res.stocks ?? []);
        setSearchLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step, searchQuery]);

  const handleSelectStock = useCallback(
    (slug: string) => {
      handleOpenChange(false);
      router.push(`/films/${slug}?action=log-roll`);
    },
    [router, handleOpenChange]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] flex flex-col overflow-hidden gap-0 p-0"
        showDragHandle
      >
        {step === "choice" ? (
          <>
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
              <SheetTitle className="text-base font-semibold">Log a roll</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setStep("search")}
                className="flex w-full items-center gap-3 rounded-card border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent/50"
              >
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">Search for a film stock</span>
              </button>
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-card border border-border bg-muted/50 px-4 py-3 text-left cursor-not-allowed opacity-60"
              >
                <Barcode className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Scan a barcode</span>
                <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setStep("choice")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
              <SheetTitle className="text-base font-semibold text-center pr-8">Find a film stock</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col min-h-0">
              <div className="shrink-0 p-4 pb-2">
                <input
                  type="search"
                  autoFocus
                  placeholder="Search film stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-card border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {searchLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Searching...</div>
                ) : searchResults && searchResults.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {searchQuery.trim() ? "No stocks found." : "Type to search."}
                  </div>
                ) : searchResults ? (
                  <div className="space-y-0 border-b border-slate-50 [&>div]:border-b [&>div]:border-slate-50">
                    {searchResults.map((s) => (
                      <button
                        key={s.slug}
                        type="button"
                        onClick={() => handleSelectStock(s.slug)}
                        className="flex w-full items-center gap-3 border-b border-border bg-white py-3 text-left"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          {s.imageUrl ? (
                            <Image
                              src={s.imageUrl}
                              alt=""
                              width={64}
                              height={64}
                              sizes="64px"
                              className="h-full w-full object-cover"
                              placeholder="blur"
                              blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-100" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.brandName}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function openLogRollChoiceDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_OPEN));
  }
}
