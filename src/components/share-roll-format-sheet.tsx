"use client";

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

/** Bottom sheet for film format using the same segmented control as Everyone / Following / You. */
export function ShareRollFormatSheet({
  open,
  onOpenChange,
  options,
  value,
  onChange,
}: ShareRollFormatSheetProps) {
  if (options.length === 0) return null;

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
      >
        <SheetTitle className="sr-only">Format</SheetTitle>
        <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SegmentedOptionTabs
            options={options}
            value={value}
            onChange={onChange}
            ariaLabel="Film format"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
