"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const MIN: number = 1;
const MAX: number = 72;

const MILESTONES = [12, 24, 36, 72] as const;

function valueToPercent(value: number): number {
  if (MAX === MIN) return 0;
  return ((value - MIN) / (MAX - MIN)) * 100;
}

/** Light tick when value changes by 1 */
function triggerHapticTick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}

/** Slightly stronger double-tap when landing on 12, 24, 36, or 72 */
function triggerHapticMilestone() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
}

export interface ExposuresRulerPickerProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function ExposuresRulerPicker({
  value,
  onChange,
  className,
}: ExposuresRulerPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef(value);
  const percentage = valueToPercent(value);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value);
      const newValue = Math.min(MAX, Math.max(MIN, Math.round(raw)));
      onChange(newValue);

      if (newValue !== lastValueRef.current) {
        triggerHapticTick();
        if (MILESTONES.includes(newValue as (typeof MILESTONES)[number])) {
          triggerHapticMilestone();
        }
        lastValueRef.current = newValue;
      }
    },
    [onChange]
  );

  return (
    <div className={cn("relative flex flex-col", className)}>
      {/* Track container */}
      <div className="relative flex flex-col">
        {/* Row 1: Track with gradient fill + thumb + range input */}
        <div className="relative h-10">
          {/* Track: linear-gradient for progress fill (amber left, slate right) */}
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden
          >
            <div
              className="h-0.5 w-full rounded-full"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
              }}
            />
          </div>

          {/* Thumb — moves smoothly with value */}
          <div
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-md ring-2 ring-primary/20 transition-[left] duration-0"
            style={{ left: `${percentage}%` }}
            aria-hidden
          />

          {/* HTML5 range: min 1, max 72, step 1 — drives value and accessibility */}
          <input
            ref={inputRef}
            type="range"
            min={MIN}
            max={MAX}
            step={1}
            value={value}
            onChange={handleInput}
            aria-valuemin={MIN}
            aria-valuemax={MAX}
            aria-valuenow={value}
            aria-label="Exposures"
            className="absolute inset-0 h-full w-full cursor-grab appearance-none bg-transparent opacity-0 active:cursor-grabbing [&::-webkit-slider-runnable-track]:h-0 [&::-moz-range-track]:h-0"
          />
        </div>

        {/* Selected value below the thumb */}
        <div className="relative -mt-1 flex h-5 items-center justify-center">
          <span
            className="absolute text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-[left] duration-0"
            style={{
              left: `${percentage}%`,
              transform: "translate(-50%, 0)",
            }}
            aria-live="polite"
          >
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}
