"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useKeyboardSafeViewport } from "@/lib/use-keyboard-safe-viewport";
import { cn } from "@/lib/utils";

type ShareRollLocationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Bottom sheet for editing roll location. Lifts with `visualViewport` bottom inset so the field
 * stays above the OSK (needs `interactive-widget: resizes-visual` — see root viewport in `layout.tsx`).
 */
export function ShareRollLocationSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: ShareRollLocationSheetProps) {
  const ksv = useKeyboardSafeViewport(open);
  const bottomInset = ksv?.bottomInset ?? 0;
  const maxSheetHeight =
    ksv != null ? Math.max(200, ksv.visualHeight - 24) : undefined;

  const inputRef = useRef<HTMLInputElement>(null);
  const [focusReady, setFocusReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setFocusReady(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFocusReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open || !focusReady) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [open, focusReady]);

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
        <SheetTitle className="sr-only">Location</SheetTitle>
        <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Add location"
            enterKeyHint="done"
            autoComplete="off"
            className="text-base"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
