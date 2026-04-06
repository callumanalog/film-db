"use client";

import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SegmentedOptionTabs } from "@/components/segmented-view-tabs";
import { cn } from "@/lib/utils";

type ShareRollFormatSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

/** Bottom sheet for film format; commits on Save (same chrome as location / lens sheets). */
export function ShareRollFormatSheet({
  open,
  onOpenChange,
  options,
  value,
  onChange,
}: ShareRollFormatSheetProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!open) return;
    const next = options.includes(value) ? value : (options[0] ?? "");
    setDraft(next);
  }, [open, value, options]);

  const handleSave = useCallback(() => {
    if (!options.includes(draft)) return;
    onChange(draft);
    onOpenChange(false);
  }, [draft, options, onChange, onOpenChange]);

  const canSave = options.includes(draft);

  if (options.length === 0) return null;

  return (
    <Sheet open={open} modal="trap-focus" onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="!z-[105] bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          "!z-[110] flex min-h-0 flex-col gap-0 border-0 p-0 shadow-2xl",
          "rounded-t-[20px] bg-background data-[side=bottom]:h-auto data-[side=bottom]:max-h-[50dvh]"
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <SheetTitle className="shrink-0 px-4 pt-4 text-left font-sans text-lg font-semibold leading-tight tracking-tight text-foreground">
            Format
          </SheetTitle>

          <div className="shrink-0 px-4 pb-4 pt-3">
            <SegmentedOptionTabs
              options={options}
              value={draft}
              onChange={setDraft}
              ariaLabel="Film format"
            />
          </div>

          <div className="mobile-safe-bottom-footer shrink-0 border-t border-border/40 px-4 pt-3">
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
