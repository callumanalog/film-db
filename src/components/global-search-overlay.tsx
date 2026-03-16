"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilmsHeaderSearch } from "@/components/films-header-search";
import { cn } from "@/lib/utils";

/** Trending film stocks for overlay (matches mobile-search-empty-state). */
const TRENDING_STOCKS = [
  { slug: "kodak-gold-200", name: "Kodak Gold 200" },
  { slug: "cinestill-800t", name: "CineStill 800T" },
  { slug: "ilford-delta-3200", name: "Ilford Delta 3200" },
  { slug: "kodak-ektar-100", name: "Kodak Ektar 100" },
  { slug: "kodak-portra-160", name: "Kodak Portra 160" },
] as const;

/** Trending brands for overlay. */
const TRENDING_BRANDS = [
  { slug: "kodak", name: "Kodak" },
  { slug: "fujifilm", name: "Fujifilm" },
  { slug: "cinestill", name: "CineStill" },
  { slug: "ilford", name: "Ilford" },
  { slug: "harman", name: "Harman" },
] as const;

interface GlobalSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Optional: close overlay after search submit (e.g. when used in FOR YOU header). */
  closeOnSubmit?: boolean;
}

export function GlobalSearchOverlay({ open, onClose, closeOnSubmit }: GlobalSearchOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            className="fixed inset-0 z-[100] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="fixed left-0 right-0 top-0 z-[101] flex flex-col bg-background shadow-lg"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
          >
            <div
              className="flex items-center gap-2 border-b border-slate-200 bg-background px-4 py-3"
              style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
            >
              <div className="min-w-0 flex-1">
                <FilmsHeaderSearch
                  variant="overlay"
                  onAfterSubmit={closeOnSubmit ? onClose : undefined}
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium",
                  "text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
                )}
              >
                Cancel
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto border-t border-slate-100 px-4 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trending film stocks
              </h3>
              <ul className="mt-2 space-y-1">
                {TRENDING_STOCKS.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/films/${s.slug}`}
                      onClick={onClose}
                      className="block rounded-lg py-2.5 px-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-100"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trending brands
              </h3>
              <ul className="mt-2 space-y-1">
                {TRENDING_BRANDS.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/brands/${b.slug}`}
                      onClick={onClose}
                      className="block rounded-lg py-2.5 px-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-100"
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
