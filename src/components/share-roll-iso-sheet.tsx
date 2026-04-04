"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ShotIsoStepperWithInput } from "@/components/shot-iso-controls";
import { useVisualViewportBox } from "@/lib/use-visual-viewport-box";
import { cn } from "@/lib/utils";

const ISO_INPUT_ID = "share-roll-shot-iso-sheet-input";

type ShareRollIsoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
};

/** Bottom sheet for shot ISO; focuses the numeric field and tracks the visual viewport above the keyboard. */
export function ShareRollIsoSheet({ open, onOpenChange, value, onChange }: ShareRollIsoSheetProps) {
  const vvBox = useVisualViewportBox();
  const keyboardOverlap =
    typeof window !== "undefined" && vvBox != null
      ? Math.max(0, window.innerHeight - vvBox.top - vvBox.height)
      : 0;

  /** Keep the sheet within the visible viewport above the software keyboard. */
  const sheetViewportStyle =
    typeof window !== "undefined" && vvBox != null
      ? { maxHeight: Math.max(160, vvBox.height - 20) }
      : undefined;

  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = "share-roll-shot-iso-sheet-label";
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
          bottom: keyboardOverlap,
          ...sheetViewportStyle,
        }}
      >
        <SheetTitle className="sr-only">Shot at ISO</SheetTitle>
        <div className="flex flex-col items-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <label
            id={labelId}
            htmlFor={ISO_INPUT_ID}
            className="mb-2 block w-full text-center text-sm font-medium text-foreground"
          >
            Shot at ISO
          </label>
          <ShotIsoStepperWithInput
            id={ISO_INPUT_ID}
            layout="centered"
            numericKeyboard
            inputRef={inputRef}
            aria-labelledby={labelId}
            value={value}
            onChange={onChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
