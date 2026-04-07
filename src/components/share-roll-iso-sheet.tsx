"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useKeyboardSafeViewport } from "@/lib/use-keyboard-safe-viewport";
import { cn } from "@/lib/utils";

const ISO_INPUT_ID = "share-roll-shot-iso-sheet-input";

type ShareRollIsoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
};

/** Bottom sheet for shot ISO; lifts with visual viewport inset above the OSK (see `layout.tsx` viewport). */
export function ShareRollIsoSheet({ open, onOpenChange, value, onChange }: ShareRollIsoSheetProps) {
  const ksv = useKeyboardSafeViewport(open);
  const bottomInset = ksv?.bottomInset ?? 0;
  const maxSheetHeight =
    ksv != null ? Math.max(200, ksv.visualHeight - 24) : undefined;

  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = "share-roll-shot-iso-sheet-label";
  const [focusReady, setFocusReady] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open) {
      setFocusReady(false);
      return;
    }
    setDraft(value);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFocusReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open, value]);

  useEffect(() => {
    if (!open || !focusReady) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [open, focusReady]);

  const canSave = draft.trim().length > 0;

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange(trimmed);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} modal="trap-focus" onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="!z-[105] bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          "!z-[110] flex flex-col gap-0 border-0 p-0 shadow-2xl",
          "rounded-t-[20px] bg-background data-[side=bottom]:h-auto data-[side=bottom]:max-h-[50dvh]"
        )}
        style={{
          bottom: bottomInset,
          ...(maxSheetHeight != null ? { maxHeight: maxSheetHeight } : {}),
        }}
      >
        <SheetTitle className="sr-only">Shot at ISO</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <label
            id={labelId}
            htmlFor={ISO_INPUT_ID}
            className="shrink-0 px-4 pt-4 text-left font-sans text-lg font-semibold leading-tight tracking-tight text-foreground"
          >
            Shot at ISO
          </label>
          <div className="shrink-0 px-4 pb-4 pt-3">
            <input
              id={ISO_INPUT_ID}
              ref={inputRef}
              aria-labelledby={labelId}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
              className="h-[52px] w-full rounded-card border border-border bg-background px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="mobile-safe-bottom-footer mt-auto shrink-0 border-t border-border/40 px-4 pt-3">
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
