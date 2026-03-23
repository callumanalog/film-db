"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type SegmentedView = "everyone" | "following" | "you";

export const SEGMENTED_VIEW_OPTIONS: { id: SegmentedView; label: string }[] = [
  { id: "everyone", label: "Everyone" },
  { id: "following", label: "Following" },
  { id: "you", label: "You" },
];

/** Everyone / Following / You control (reviews tab, scans tab, etc.). */
export function SegmentedViewTabs({
  value,
  onChange,
  ariaLabel,
}: {
  value: SegmentedView;
  onChange: (v: SegmentedView) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex items-stretch overflow-hidden rounded-[7px] border border-border/70 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:border-border dark:shadow-none"
      role="tablist"
      aria-label={ariaLabel}
    >
      {SEGMENTED_VIEW_OPTIONS.map((opt, index) => (
        <Fragment key={opt.id}>
          {index > 0 ? (
            <div
              className="w-px shrink-0 self-stretch bg-border/80 dark:bg-border"
              aria-hidden
            />
          ) : null}
          <button
            type="button"
            role="tab"
            aria-selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "min-w-0 flex-1 px-2 py-2.5 text-center text-sm font-medium tracking-tight transition-[color,background-color,transform,box-shadow]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "active:scale-[0.98] active:transition-none",
              value === opt.id
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground active:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
