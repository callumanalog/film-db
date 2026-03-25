"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { NotebookPen, ImagePlus, ListPlus } from "lucide-react";
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

function getFilmSlug(pathname: string | null): string | null {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "films" && parts.length >= 2 && !["images"].includes(parts[parts.length - 1])) {
    return parts[1];
  }
  return null;
}

function slugToName(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function PlusActionSheet() {
  const [open, setOpen] = useState(false);
  const [contextSlug, setContextSlug] = useState<string | null>(null);
  const [contextName, setContextName] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<"review" | "upload">("review");
  const [searchStep, setSearchStep] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggested, setSuggested] = useState<{ label: string; stocks: SearchStocksResult[]; allStocks: SearchStocksResult[] } | null>(null);
  const [selectedStock, setSelectedStock] = useState<SearchStocksResult | null>(null);
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
        ).slice(0, 10)
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
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 pb-8">
          {searchStep && (
            <SheetHeader className="pb-4">
              <SheetTitle>Choose a film stock</SheetTitle>
            </SheetHeader>
          )}
          {!searchStep && <SheetTitle className="sr-only">Actions</SheetTitle>}

          {searchStep ? (
            <div className="px-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search film stocks..."
                autoFocus
                className="w-full rounded-[7px] border border-border/50 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {!searchQuery && suggested && (
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{suggested.label}</p>
              )}
              <ul className="mt-2 max-h-64 overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <li key={stock.slug}>
                    <button
                      type="button"
                      onClick={() => handleSelectStock(stock)}
                      className="flex w-full items-center gap-3 rounded-[7px] px-2 py-2.5 text-left transition-colors hover:bg-accent/50"
                    >
                      <span className="text-sm font-medium text-foreground">{stock.name}</span>
                      <span className="text-xs text-muted-foreground">{stock.brandName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-4">
              <button
                type="button"
                onClick={() => handleAction("review")}
                className="flex items-center gap-3 rounded-[7px] border border-border/50 bg-card px-4 py-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <NotebookPen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Add a review</p>
                  <p className="text-xs text-muted-foreground">Write about a stock you've shot</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction("upload")}
                className="flex items-center gap-3 rounded-[7px] border border-border/50 bg-card px-4 py-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                  <ImagePlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Add shots</p>
                  <p className="text-xs text-muted-foreground">Upload images to the gallery</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  showToastViaEvent("Lists are coming soon!");
                }}
                className="flex items-center gap-3 rounded-[7px] border border-border/50 bg-card px-4 py-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                  <ListPlus className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Create a list</p>
                  <p className="text-xs text-muted-foreground">Curate a collection of film stocks</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-1 w-full border-t border-border/50 pt-3 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Close
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {selectedStock && (
        <AddReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          mode={reviewModalMode}
          slotsUsed={reviewModalMode === "upload" ? 1 : 0}
          initialRating={0}
          stock={{
            slug: selectedStock.slug,
            name: selectedStock.name,
            brand: { name: selectedStock.brandName, slug: "" },
            format: selectedStock.format ?? [],
            image_url: selectedStock.imageUrl ?? null,
          }}
          onSubmit={async (payload: AddReviewModalPayload) => {
            if (user) {
              const formData = new FormData();
              formData.set("film_stock_slug", selectedStock.slug);
              formData.set("mode", reviewModalMode);
              formData.set("rating", String(payload.rating));
              if (payload.reviewTitle) formData.set("review_title", payload.reviewTitle);
              if (payload.reviewText) formData.set("review_text", payload.reviewText);
              if (payload.shootingTip) formData.set("shooting_tip", payload.shootingTip);
              if (payload.camera) formData.set("camera", payload.camera);
              if (payload.lens) formData.set("lens", payload.lens);
              if (payload.developedAt) formData.set("developed_at", payload.developedAt);
              if (payload.caption) formData.set("caption", payload.caption);
              if (payload.shotIso) formData.set("shot_iso", payload.shotIso);
              if (payload.lab) formData.set("lab", payload.lab);
              if (payload.filter) formData.set("filter", payload.filter);
              if (payload.scanner) formData.set("scanner", payload.scanner);
              if (payload.format) formData.set("format", payload.format);
              if (payload.location) formData.set("location", payload.location);
              if (payload.iso) formData.set("iso", payload.iso);
              if (payload.bestFor?.length) formData.set("best_for", JSON.stringify(payload.bestFor));
              const usedPreUpload = reviewModalMode === "upload" && !!payload.uploadedImageUrl;
              if (usedPreUpload) {
                formData.set("image_url", payload.uploadedImageUrl!);
              } else {
                payload.files.forEach((file, i) => formData.append(`file_${i}`, file));
              }
              try {
                const res = await fetch("/api/user/reviews", { method: "POST", body: formData });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  const msg = [data.error, data.detail].filter(Boolean).join(" ");
                  showToastViaEvent(msg || "Failed to submit");
                  return;
                }
                const uploadSucceeded = data.uploaded > 0;
                if ((payload.files.length > 0 || payload.uploadedImageUrl) && uploadSucceeded) {
                  window.dispatchEvent(new CustomEvent("film-upload-complete", { detail: { slug: selectedStock.slug } }));
                }
                if (data.reviewSaved) {
                  window.dispatchEvent(new CustomEvent("review-submitted", { detail: { slug: selectedStock.slug } }));
                }
                showToastViaEvent(
                  reviewModalMode === "upload"
                    ? (payload.uploadedImageUrl || payload.files.length > 0 ? "Thanks! Your images have been uploaded." : "Done.")
                    : payload.files.length > 0
                      ? "Thanks! Your photos and review have been submitted."
                      : "Thanks! Your review has been submitted."
                );
                if (reviewModalMode === "upload" && (payload.uploadedImageUrl || payload.files.length > 0) && uploadSucceeded) {
                  return { success: true };
                }
              } catch {
                showToastViaEvent("Failed to submit");
              }
            } else {
              if (payload.rating > 0) persistRating(selectedStock.slug, payload.rating);
              showToastViaEvent("Log in to save your review.");
            }
          }}
        />
      )}
    </>
  );
}
