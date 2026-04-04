"use client";

import type { RefObject } from "react";
import { Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Common box speeds and practical pull/push equivalents for stepping shot ISO. */
export const FILM_SHOT_ISO_PRESETS = [
  25, 32, 40, 50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000,
  2500, 3200, 6400, 12800,
] as const;

export function nearestPresetIso(iso: number): (typeof FILM_SHOT_ISO_PRESETS)[number] {
  let best: (typeof FILM_SHOT_ISO_PRESETS)[number] = FILM_SHOT_ISO_PRESETS[0];
  let bestDist = Math.abs(iso - best);
  for (const v of FILM_SHOT_ISO_PRESETS) {
    const d = Math.abs(iso - v);
    if (d < bestDist) {
      best = v;
      bestDist = d;
    }
  }
  return best;
}

export function shotIsoPresetIndex(value: string): number {
  const n = parseInt(value.trim(), 10);
  if (!Number.isFinite(n)) {
    return FILM_SHOT_ISO_PRESETS.indexOf(400);
  }
  const exact = FILM_SHOT_ISO_PRESETS.findIndex((v) => v === n);
  if (exact >= 0) return exact;
  const nearest = nearestPresetIso(n);
  return FILM_SHOT_ISO_PRESETS.findIndex((v) => v === nearest);
}

export function ShotIsoStepper({
  value,
  onChange,
  className,
  "aria-labelledby": ariaLabelledBy,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  "aria-labelledby"?: string;
}) {
  const idx = shotIsoPresetIndex(value);
  const current = FILM_SHOT_ISO_PRESETS[idx];
  const atMin = idx <= 0;
  const atMax = idx >= FILM_SHOT_ISO_PRESETS.length - 1;

  return (
    <div
      role="group"
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "flex h-10 w-full min-w-0 items-stretch overflow-hidden rounded-card border border-input bg-transparent dark:bg-input/30",
        className
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (atMin) return;
          onChange(String(FILM_SHOT_ISO_PRESETS[idx - 1]));
        }}
        disabled={atMin}
        className="flex w-11 shrink-0 items-center justify-center border-r border-input text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        aria-label="Lower ISO"
      >
        <Minus className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      <div
        className="flex min-w-0 flex-1 items-center justify-center tabular-nums text-sm font-medium text-foreground"
        aria-live="polite"
      >
        {current}
      </div>
      <button
        type="button"
        onClick={() => {
          if (atMax) return;
          onChange(String(FILM_SHOT_ISO_PRESETS[idx + 1]));
        }}
        disabled={atMax}
        className="flex w-11 shrink-0 items-center justify-center border-l border-input text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        aria-label="Raise ISO"
      >
        <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

const stepperSideButtonClassName =
  "flex w-11 min-w-[2.75rem] max-w-[2.75rem] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function ShotIsoStepperWithInput({
  id,
  value,
  onChange,
  className,
  layout = "stretch",
  numericKeyboard = false,
  "aria-labelledby": ariaLabelledBy,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
  /** `stretch`: full-width row. `centered`: intrinsic width, equal − / + columns (e.g. bottom sheet). */
  layout?: "stretch" | "centered";
  /** Use `inputMode="numeric"` (+ pattern) so mobile OS shows the number keypad while keeping `type="text"`. */
  numericKeyboard?: boolean;
  "aria-labelledby"?: string;
  /** Optional ref to the center numeric field (e.g. auto-focus in a sheet). */
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const idx = shotIsoPresetIndex(value);
  const atMin = idx <= 0;
  const atMax = idx >= FILM_SHOT_ISO_PRESETS.length - 1;

  const isCentered = layout === "centered";

  return (
    <div
      role="group"
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "h-10 items-stretch overflow-hidden rounded-card border border-input bg-transparent dark:bg-input/30",
        isCentered
          ? "inline-grid w-max max-w-full grid-cols-[2.75rem_minmax(4rem,7rem)_2.75rem]"
          : "flex w-full min-w-0",
        className
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (atMin) return;
          onChange(String(FILM_SHOT_ISO_PRESETS[idx - 1]));
        }}
        disabled={atMin}
        className={cn(stepperSideButtonClassName, "border-r border-input")}
        aria-label="Lower ISO"
      >
        <Minus className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode={numericKeyboard ? "numeric" : undefined}
        pattern={numericKeyboard ? "[0-9]*" : undefined}
        enterKeyHint={numericKeyboard ? "done" : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 min-h-0 w-full min-w-0 rounded-none border-0 bg-transparent px-1 py-0 text-center text-sm font-medium tabular-nums shadow-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 dark:bg-transparent",
          !isCentered && "min-w-[5.75ch] max-w-[12ch] flex-1"
        )}
      />
      <button
        type="button"
        onClick={() => {
          if (atMax) return;
          onChange(String(FILM_SHOT_ISO_PRESETS[idx + 1]));
        }}
        disabled={atMax}
        className={cn(stepperSideButtonClassName, "border-l border-input")}
        aria-label="Raise ISO"
      >
        <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
