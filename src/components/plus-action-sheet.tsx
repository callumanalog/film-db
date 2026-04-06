"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Image as ImageIcon, ListPlus, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AddReviewModal } from "@/components/add-review-modal";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { useUserActions } from "@/context/user-actions-context";
import { getSuggestedStocks, type SearchStocksResult } from "@/app/actions/search";
import type { AddReviewModalPayload } from "@/components/add-review-modal";
import { FilmStockListCardButton } from "@/components/film-stock-list-card";
import { MobileStockPickerPanel } from "@/components/mobile-stock-picker-panel";
import {
  formatClientUploadFailuresForToast,
  interpretReviewsPostResult,
} from "@/lib/review-submit-feedback";
import { postReviewModalSubmission } from "@/lib/user-reviews-client-submit";
import { cn } from "@/lib/utils";

const EVENT_OPEN = "plus-action-sheet:open";

export interface OpenPayload {
  filmSlug?: string;
  filmName?: string;
}

export function openPlusActionSheet(payload?: OpenPayload) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_OPEN, { detail: payload }));
  }
}

export function PlusActionSheet() {
  const [open, setOpen] = useState(false);
  const [contextSlug, setContextSlug] = useState<string | null>(null);
  const [contextName, setContextName] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<"review" | "upload">("review");
  const [searchStep, setSearchStep] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggested, setSuggested] = useState<{ stocks: SearchStocksResult[]; allStocks: SearchStocksResult[] } | null>(null);
  const [selectedStock, setSelectedStock] = useState<SearchStocksResult | null>(null);
  const [shareRollSubmitHint, setShareRollSubmitHint] = useState<string | null>(null);
  const { user } = useAuth();
  const { setRating: persistRating } = useUserActions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenPayload | undefined>).detail;
      setContextSlug(detail?.filmSlug ?? null);
      setContextName(detail?.filmName ?? null);
      setSearchStep(false);
      setSearchQuery("");
      setOpen(true);
    };
    window.addEventListener(EVENT_OPEN, handleOpen);
    return () => window.removeEventListener(EVENT_OPEN, handleOpen);
  }, []);

  useEffect(() => {
    if (!searchStep) return;
    getSuggestedStocks().then(setSuggested);
  }, [searchStep]);

  const filteredStocks = suggested?.allStocks
    ? searchQuery.trim()
      ? suggested.allStocks.filter((s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.brandName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : suggested.stocks
    : [];

  const openModalForStock = useCallback((stock: SearchStocksResult, mode: "review" | "upload") => {
    setSelectedStock(stock);
    setOpen(false);
    setTimeout(() => {
      setReviewModalMode(mode);
      setReviewModalOpen(true);
    }, 200);
  }, []);

  const handleAction = (mode: "review" | "upload") => {
    if (!user) {
      router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
      setOpen(false);
      return;
    }
    if (contextSlug) {
      setOpen(false);
      router.push(`/films/${contextSlug}?action=upload`);
      return;
    }
    setReviewModalMode(mode);
    setSearchStep(true);
  };

  const handleSelectStock = (stock: SearchStocksResult) => {
    openModalForStock(stock, reviewModalMode);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={cn(
            "mobile-safe-bottom-content gap-0 bg-white px-0",
            searchStep &&
              "inset-0 h-[100dvh] max-h-none rounded-none border-0 pb-0 data-[side=bottom]:top-0 data-[side=bottom]:h-[100dvh] data-[side=bottom]:max-h-none data-[side=bottom]:rounded-none data-[side=bottom]:border-0 md:inset-x-0 md:bottom-0 md:top-auto md:h-[78dvh] md:max-h-[78dvh] md:rounded-t-[20px] md:border-t md:pb-8 md:data-[side=bottom]:top-auto md:data-[side=bottom]:h-[78dvh] md:data-[side=bottom]:max-h-[78dvh] md:data-[side=bottom]:rounded-t-[20px] md:data-[side=bottom]:border-t"
          )}
        >
          {searchStep && (
            <SheetHeader className="hidden pb-4 md:flex">
              <SheetTitle>{reviewModalMode === "upload" ? "What did you shoot?" : "Choose a film stock"}</SheetTitle>
            </SheetHeader>
          )}
          {!searchStep && <SheetTitle className="sr-only">Actions</SheetTitle>}

          {searchStep ? (
            <>
              <MobileStockPickerPanel
                mode={reviewModalMode}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onClose={() => {
                  setSearchQuery("");
                  setSearchStep(false);
                }}
                onSelectStock={handleSelectStock}
                stocks={suggested?.allStocks ?? []}
              />

              <div className="hidden min-h-0 flex-1 flex-col px-4 md:flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search film stocks..."
                  autoFocus
                  className="w-full rounded-[7px] border border-border/50 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <ul className="no-scrollbar mt-3 h-[528px] min-h-[528px] overflow-x-hidden overflow-y-auto rounded-[7px] bg-card">
                  {filteredStocks.map((stock) => (
                    <li key={stock.slug}>
                      <FilmStockListCardButton stock={stock} onSelect={() => handleSelectStock(stock)} />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="border-t border-border/40">
                <button
                  type="button"
                  onClick={() => handleAction("upload")}
                  className="flex w-full items-start gap-3 px-6 py-3.5 text-left transition-colors hover:bg-accent"
                >
                  <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">Add a roll</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      Upload scans from a roll of film
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("review")}
                  className="flex w-full items-start gap-3 px-6 py-3.5 text-left transition-colors hover:bg-accent"
                >
                  <Pencil className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">Review a stock</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      Search for a stock to review
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (!user) {
                      router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/lists/new")}`);
                      return;
                    }
                    router.push("/lists/new");
                  }}
                  className="flex w-full items-start gap-3 px-6 py-3.5 text-left transition-colors hover:bg-accent"
                >
                  <ListPlus className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">Create a list</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      Curate stocks you love
                    </span>
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mx-4 mt-2 w-[calc(100%-2rem)] border-t border-border/40 pt-3 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Close
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>

      {selectedStock && (
        <AddReviewModal
          open={reviewModalOpen}
          onOpenChange={(o) => {
            setReviewModalOpen(o);
            if (!o) {
              setSelectedStock(null);
              setShareRollSubmitHint(null);
            }
          }}
          onBackToStockPicker={() => {
            setReviewModalOpen(false);
            setSelectedStock(null);
            setSearchQuery("");
            setSearchStep(true);
            setOpen(true);
          }}
          mode={reviewModalMode}
          slotsUsed={reviewModalMode === "upload" ? 1 : 0}
          initialRating={0}
          stock={{
            slug: selectedStock.slug,
            name: selectedStock.name,
            brand: { name: selectedStock.brandName, slug: "" },
            format: selectedStock.format ?? [],
            image_url: selectedStock.imageUrl ?? null,
            iso: selectedStock.iso ?? undefined,
          }}
          shareRollSubmitHint={shareRollSubmitHint}
          onSubmit={async (payload: AddReviewModalPayload) => {
            if (user) {
              const usedPreUpload = reviewModalMode === "upload" && !!payload.uploadedImageUrl;
              const outcome = await postReviewModalSubmission({
                filmStockSlug: selectedStock.slug,
                mode: reviewModalMode,
                payload,
                onProgress:
                  payload.files.length > 0 ? (label) => setShareRollSubmitHint(label) : undefined,
              });
              if (!outcome.ok) {
                showToastViaEvent(outcome.toast);
                return { success: false };
              }
              const data = outcome.data;
              const attemptedPhotos = payload.files.length;
              const interpreted = interpretReviewsPostResult(data, {
                mode: reviewModalMode,
                fileCount: attemptedPhotos,
                attemptedUploads: attemptedPhotos,
                usedPreUploadedUrl: usedPreUpload,
              });
              if (!interpreted.ok) {
                showToastViaEvent(interpreted.message);
                return { success: false };
              }
              const uploadSucceeded = interpreted.uploaded > 0;
              if ((attemptedPhotos > 0 || payload.uploadedImageUrl) && uploadSucceeded) {
                window.dispatchEvent(
                  new CustomEvent("film-upload-complete", { detail: { slug: selectedStock.slug } })
                );
              }
              if (interpreted.reviewSaved) {
                window.dispatchEvent(
                  new CustomEvent("review-submitted", { detail: { slug: selectedStock.slug } })
                );
              }
              const uploadedCount = interpreted.uploaded;
              if (outcome.clientUploadFailures?.length) {
                showToastViaEvent(
                  formatClientUploadFailuresForToast(
                    outcome.clientUploadFailures,
                    uploadedCount,
                    attemptedPhotos
                  )
                );
              }
              if (interpreted.uploadFailed && interpreted.uploadFailed > 0) {
                showToastViaEvent(
                  `${uploadedCount} photo(s) saved; ${interpreted.uploadFailed} could not be saved to your gallery. Try again from your profile if needed.`
                );
              } else if (reviewModalMode === "upload") {
                if (payload.uploadedImageUrl || attemptedPhotos > 0) {
                  showToastViaEvent("Thanks! Your roll has been published.");
                } else {
                  showToastViaEvent("Done.");
                }
              } else if (attemptedPhotos > 0) {
                showToastViaEvent("Thanks! Your photos and review have been submitted.");
              } else {
                showToastViaEvent("Thanks! Your review has been submitted.");
              }
              return { success: true };
            } else {
              if (payload.rating > 0) persistRating(selectedStock.slug, payload.rating);
              showToastViaEvent(
                reviewModalMode === "upload"
                  ? (payload.files.length > 0 ? "Log in to save your roll." : "Done.")
                  : "Log in to save your review."
              );
            }
          }}
        />
      )}
    </>
  );
}
