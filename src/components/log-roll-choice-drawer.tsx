"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  ChevronRight,
  Film,
  ImagePlus,
} from "lucide-react";
import {
  getSuggestedStocks,
  type SearchStocksResult,
  type SuggestedStocksResult,
} from "@/app/actions/search";
import { FilmStockListCardButton } from "@/components/film-stock-list-card";
import { cn } from "@/lib/utils";

const EVENT_OPEN = "openLogRollChoiceDrawer";

type Intent = "log" | "upload";
type Step = "intent" | "search";

interface OpenPayload {
  filmSlug?: string;
  filmName?: string;
}

const MAX_FILTER_RESULTS = 20;

function filterStocks(allStocks: SearchStocksResult[], query: string): SearchStocksResult[] {
  const lower = query.toLowerCase();
  return allStocks
    .filter((s) => s.name.toLowerCase().includes(lower) || s.brandName.toLowerCase().includes(lower))
    .slice(0, MAX_FILTER_RESULTS);
}

export function LogRollChoiceDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [step, setStep] = useState<Step>("intent");
  const [searchQuery, setSearchQuery] = useState("");

  const [contextSlug, setContextSlug] = useState<string | null>(null);
  const [contextName, setContextName] = useState<string | null>(null);

  const [suggested, setSuggested] = useState<SuggestedStocksResult | null>(null);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedFetched, setSuggestedFetched] = useState(false);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenPayload | undefined>).detail;
      setStep("intent");
      setIntent(null);
      setSearchQuery("");
      setContextSlug(detail?.filmSlug ?? null);
      setContextName(detail?.filmName ?? null);
      requestAnimationFrame(() => setOpen(true));
    };
    window.addEventListener(EVENT_OPEN, handleOpen);
    return () => window.removeEventListener(EVENT_OPEN, handleOpen);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) {
      setStep("intent");
      setIntent(null);
      setSearchQuery("");
      setContextSlug(null);
      setContextName(null);
    }
    setOpen(next);
  }, []);

  const navigateToFilm = useCallback(
    (slug: string, action: "log-roll" | "upload") => {
      handleOpenChange(false);
      router.push(`/films/${slug}?action=${action}`);
    },
    [router, handleOpenChange]
  );

  const handleChooseIntent = (chosen: Intent) => {
    if (contextSlug) {
      navigateToFilm(contextSlug, chosen === "log" ? "log-roll" : "upload");
      return;
    }
    setIntent(chosen);
    setStep("search");
    setSearchQuery("");

    if (!suggestedFetched) {
      setSuggestedLoading(true);
      getSuggestedStocks().then((res) => {
        setSuggested(res);
        setSuggestedLoading(false);
        setSuggestedFetched(true);
      });
    }
  };

  const handleSelectStock = useCallback(
    (slug: string) => {
      navigateToFilm(slug, intent === "upload" ? "upload" : "log-roll");
    },
    [navigateToFilm, intent]
  );

  const hasContext = !!contextSlug;
  const searchTitle = intent === "upload" ? "Which film stock?" : "Find a film stock";
  const searchPlaceholder =
    intent === "upload" ? "Search for the film you shot..." : "Search film stocks...";

  const trimmedQuery = step === "search" ? searchQuery.trim() : "";
  const filteredStocks = trimmedQuery && suggested?.allStocks
    ? filterStocks(suggested.allStocks, trimmedQuery)
    : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "flex flex-col overflow-hidden gap-0 p-0",
          step === "search" ? "h-[85dvh] max-h-[85dvh]" : "max-h-[85dvh]"
        )}
        showDragHandle
        showCloseButton={false}
      >
        {step === "intent" ? (
          <div className="flex flex-col pt-1">
            {hasContext && (
              <div className="mb-4 text-center px-5">
                <h2 className="text-base font-semibold tracking-tight text-foreground [font-family:var(--font-playfair),serif]">
                  {contextName ?? "This film"}
                </h2>
              </div>
            )}

            <div className="flex flex-col gap-2.5 px-5">
              <button
                type="button"
                onClick={() => handleChooseIntent("log")}
                className={cn(
                  "group relative flex items-center gap-4 rounded-[12px] border border-border/80 bg-card p-4",
                  "transition-all duration-150 ease-out",
                  "active:scale-[0.98] active:bg-accent/40",
                  "hover:border-border hover:shadow-sm"
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Film className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-[15px] font-semibold text-foreground leading-tight">
                    Log a Roll
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                    {hasContext ? "Add to your fridge, camera, or processing" : "Track a roll in your vault"}
                  </span>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-150 group-active:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>

              <button
                type="button"
                onClick={() => handleChooseIntent("upload")}
                className={cn(
                  "group relative flex items-center gap-4 rounded-[12px] border border-border/80 bg-card p-4",
                  "transition-all duration-150 ease-out",
                  "active:scale-[0.98] active:bg-accent/40",
                  "hover:border-border hover:shadow-sm"
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                  <ImagePlus className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-[15px] font-semibold text-foreground leading-tight">
                    Upload Scans
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                    {hasContext ? "Post your shots to the gallery" : "Share your shots with the community"}
                  </span>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-150 group-active:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
            </div>

            <div className="mt-4 border-t border-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="w-full py-3.5 text-center text-sm font-medium text-muted-foreground transition-colors active:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border px-4 py-3 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setStep("intent");
                  setIntent(null);
                  setSearchQuery("");
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
              <span className="flex-1 text-center text-[15px] font-semibold text-foreground pr-8">
                {searchTitle}
              </span>
            </div>
            <div className="flex flex-1 flex-col min-h-0">
              <div className="shrink-0 p-4 pb-2">
                <input
                  type="search"
                  autoFocus
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-shadow"
                />
              </div>
              <div className="bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="h-[445px] overflow-y-auto">
                  {suggestedLoading ? (
                    <div className="space-y-3 pt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                          <div className="h-16 w-16 shrink-0 rounded-md bg-muted/60" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-32 rounded bg-muted/60" />
                            <div className="h-3 w-20 rounded bg-muted/40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredStocks ? (
                    filteredStocks.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">No stocks found.</div>
                    ) : (
                      <div>
                        {filteredStocks.map((s) => (
                          <FilmStockListCardButton key={s.slug} stock={s} onSelect={handleSelectStock} />
                        ))}
                      </div>
                    )
                  ) : suggested && suggested.stocks.length > 0 ? (
                    <>
                      <p className="pt-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {suggested.label}
                      </p>
                      <div>
                        {suggested.stocks.map((s) => (
                          <FilmStockListCardButton key={s.slug} stock={s} onSelect={handleSelectStock} />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function openLogRollChoiceDrawer(payload?: OpenPayload) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_OPEN, { detail: payload }));
  }
}
