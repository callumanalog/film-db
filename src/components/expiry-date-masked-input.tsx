"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const MONTH_MIN = 1;
const MONTH_MAX = 12;
const YEAR_MIN = 2024;
const YEAR_MAX = 2040;

const SLASH_START = 2;
const SLASH_END = 5; // exclusive, so indices 2,3,4 are " / "
const YEAR_START = 5;

function formatDisplay(mmYYYY: string): string {
  const month = mmYYYY.slice(0, 2).padEnd(2, " ");
  const year = mmYYYY.slice(2, 6).padEnd(4, " ");
  return `${month} / ${year}`;
}

function clampMonth(n: number): string {
  const v = Math.min(MONTH_MAX, Math.max(MONTH_MIN, n));
  return v < 10 ? `0${v}` : String(v);
}

function clampYear(n: number): string {
  const v = Math.min(YEAR_MAX, Math.max(YEAR_MIN, n));
  return String(v);
}

export interface ExpiryDateMaskedInputProps {
  value: string; // "MMYYYY" (0-6 digits)
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
}

export function ExpiryDateMaskedInput({
  value,
  onChange,
  id,
  className,
  placeholder = "MM / YYYY",
}: ExpiryDateMaskedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextCursorRef = useRef<number | null>(null);

  const digitsOnly = value.replace(/\D/g, "");
  const monthPart = digitsOnly.slice(0, 2);
  const yearPart = digitsOnly.slice(2, 6);

  const displayValue = value === "" ? "" : formatDisplay(value);

  const setRawFromParts = useCallback(
    (month: string, year: string) => {
      const m = month.replace(/\D/g, "").slice(0, 2);
      let y = year.replace(/\D/g, "").slice(0, 4);
      let newMonth = m;
      if (m.length === 2) {
        const num = parseInt(m, 10);
        if (!Number.isNaN(num)) newMonth = clampMonth(num);
      }
      if (y.length === 4) {
        const num = parseInt(y, 10);
        if (!Number.isNaN(num)) y = clampYear(num);
      }
      onChange(newMonth + y);
    },
    [onChange]
  );

  useEffect(() => {
    const el = inputRef.current;
    if (!el || nextCursorRef.current === null) return;
    const pos = nextCursorRef.current;
    nextCursorRef.current = null;
    el.setSelectionRange(pos, pos);
  }, [displayValue]);

  const positionToDigitIndex = (pos: number): number => {
    if (pos <= 1) return pos;
    if (pos < YEAR_START) return 2;
    return Math.min(6, pos - (YEAR_START - 2));
  };

  const digitIndexToPosition = (idx: number): number => {
    if (idx <= 1) return idx;
    return YEAR_START + (idx - 2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = inputRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;

    if (e.key === "ArrowLeft" && pos > 0) {
      e.preventDefault();
      const next = pos > SLASH_END ? pos - 1 : pos === 1 ? 0 : 1;
      el.setSelectionRange(next, next);
      return;
    }
    if (e.key === "ArrowRight" && pos < 9) {
      e.preventDefault();
      const next = pos < SLASH_START ? pos + 1 : (pos < SLASH_END ? YEAR_START : pos + 1);
      el.setSelectionRange(next, next);
      return;
    }

    const idx = positionToDigitIndex(pos);

    if (e.key === "Backspace") {
      e.preventDefault();
      if (idx <= 0) return;
      if (idx <= 2) {
        const newMonth = monthPart.slice(0, monthPart.length - 1);
        setRawFromParts(newMonth, yearPart);
        nextCursorRef.current = digitIndexToPosition(newMonth.length);
        return;
      }
      const yearIdx = idx - 2;
      const newYear = yearPart.slice(0, yearIdx - 1);
      setRawFromParts(monthPart, newYear);
      nextCursorRef.current = yearIdx > 0 ? digitIndexToPosition(2 + newYear.length) : 1;
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      if (idx >= 6) return;
      if (idx < 2) {
        const newMonth = monthPart.slice(0, idx) + monthPart.slice(idx + 1);
        setRawFromParts(newMonth, yearPart);
        nextCursorRef.current = digitIndexToPosition(idx);
        return;
      }
      const yearIdx = idx - 2;
      const newYear = yearPart.slice(0, yearIdx) + yearPart.slice(yearIdx + 1);
      setRawFromParts(monthPart, newYear);
      nextCursorRef.current = digitIndexToPosition(2 + newYear.length);
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      if (idx < 2) {
        const newMonth = (monthPart + e.key).slice(0, 2);
        setRawFromParts(newMonth, yearPart);
        nextCursorRef.current = newMonth.length === 2 ? YEAR_START : newMonth.length;
        return;
      }
      const yearIdx = idx - 2;
      const newYear = (yearPart.slice(0, yearIdx) + e.key + yearPart.slice(yearIdx)).slice(0, 4);
      setRawFromParts(monthPart, newYear);
      nextCursorRef.current = YEAR_START + newYear.length;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 2) {
      setRawFromParts(raw, "");
      nextCursorRef.current = raw.length;
      return;
    }
    if (raw.length <= 6) {
      setRawFromParts(raw.slice(0, 2), raw.slice(2));
      nextCursorRef.current = raw.length <= 2 ? raw.length : YEAR_START + Math.min(4, raw.length - 2);
      return;
    }
    setRawFromParts(raw.slice(0, 2), raw.slice(2, 6));
    nextCursorRef.current = 9;
  };

  const handleSelect = () => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if ((start >= SLASH_START && start < SLASH_END) || (end > SLASH_START && end <= SLASH_END)) {
        el.setSelectionRange(YEAR_START, YEAR_START);
      }
    });
  };

  const handleClick = () => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const pos = el.selectionStart ?? 0;
      if (pos >= SLASH_START && pos < SLASH_END) {
        el.setSelectionRange(YEAR_START, YEAR_START);
      }
    });
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={9}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onSelect={handleSelect}
      onClick={handleClick}
      aria-label="Expiry date (MM / YYYY)"
      className={cn(
        "w-full rounded-[7px] border border-slate-200 bg-background px-3 text-ui outline-none transition-colors placeholder:text-ui placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary md:text-sm",
        "font-sans tabular-nums text-foreground",
        "h-11 min-h-11",
        className
      )}
    />
  );
}
