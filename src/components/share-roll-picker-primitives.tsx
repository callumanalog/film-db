"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const SHARE_ROLL_PICKER_ROW_HEIGHT = 48;

export const shareRollPickerSectionLabelClassName =
  "px-3 text-[10px] font-medium uppercase leading-tight tracking-wider text-muted-foreground";

export const shareRollPickerOptionButtonClassName = cn(
  "flex h-full w-full items-center px-3 py-2.5 text-left text-sm font-medium transition-colors",
  "hover:bg-secondary/60 active:bg-secondary dark:hover:bg-secondary/50"
);

/** Matches add-review-modal empty “Upload up to 10 scans” / in-grid add tile. */
export const scanUploadDashedSurfaceClassName = cn(
  "rounded-[7px] border-2 border-dashed border-border/60 bg-muted/20 transition-colors",
  "hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
);

export function ShareRollPickerOptionRow({
  label,
  selected,
  onPick,
  showBottomBorder = true,
}: {
  label: string;
  selected: boolean;
  onPick: () => void;
  showBottomBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full",
        showBottomBorder && "border-b border-border/40 dark:border-white/10"
      )}
      style={{ minHeight: SHARE_ROLL_PICKER_ROW_HEIGHT }}
    >
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={onPick}
        style={{ minHeight: SHARE_ROLL_PICKER_ROW_HEIGHT }}
        className={shareRollPickerOptionButtonClassName}
      >
        {label}
      </button>
    </div>
  );
}

/** Catalog miss — free-text value on pick (not persisted to DB). Styled like scan upload empty state. */
export function ShareRollPickerAddCustomEmptyState({
  term,
  entityLabel,
  onPick,
  className,
}: {
  term: string;
  entityLabel: "camera" | "lab" | "scanner";
  onPick: () => void;
  className?: string;
}) {
  const a11y =
    entityLabel === "camera"
      ? `Add ${term} as a camera`
      : entityLabel === "lab"
        ? `Add ${term} as a lab`
        : `Add ${term} as a scanner`;
  return (
    <button
      type="button"
      role="option"
      aria-label={a11y}
      onClick={onPick}
      className={cn(
        scanUploadDashedSurfaceClassName,
        "flex w-full flex-col items-center justify-center gap-3 py-12 disabled:opacity-50",
        className
      )}
    >
      <Plus className="h-10 w-10 shrink-0 text-muted-foreground" aria-hidden />
      <span className="px-3 text-center text-sm font-medium text-muted-foreground">
        Add <span className="font-semibold text-foreground">{term}</span> as a {entityLabel}
      </span>
    </button>
  );
}
