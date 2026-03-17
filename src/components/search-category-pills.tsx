"use client";

import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";
import {
  FILM_TYPE_LABELS,
  GRAIN_LABELS,
  CONTRAST_LABELS,
  LATITUDE_LABELS,
  SATURATION_LABELS,
  BEST_FOR_LABELS,
} from "@/lib/types";

const CATEGORIES: { key: string; label: string; paramKey: string }[] = [
  { key: "Sort", label: "Sort", paramKey: "sort" },
  { key: "Format", label: "Format", paramKey: "format" },
  { key: "ISO", label: "ISO", paramKey: "iso" },
  { key: "Type", label: "Type", paramKey: "type" },
  { key: "Brand", label: "Brand", paramKey: "brand" },
  { key: "Use case", label: "Use case", paramKey: "bestFor" },
  { key: "Latitude", label: "Latitude", paramKey: "latitude" },
  { key: "Grain", label: "Grain", paramKey: "grain" },
  { key: "Saturation", label: "Saturation", paramKey: "saturation" },
];

function getParamArray(searchParams: URLSearchParams, key: string): string[] {
  const v = searchParams.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

const ISO_8_80_VALUES = ["8", "12", "20", "25", "50", "80"];

function getCategoryCount(searchParams: URLSearchParams, paramKey: string): number {
  const arr = getParamArray(searchParams, paramKey);
  if (paramKey === "iso") {
    const has8_80 = ISO_8_80_VALUES.every((v) => arr.includes(v));
    const rest = arr.filter((v) => !ISO_8_80_VALUES.includes(v));
    return (has8_80 ? 1 : 0) + rest.length;
  }
  return arr.length;
}

/** Resolve display label for a single selected value in a category (for pill when count === 1). */
function getSingleValueLabel(
  paramKey: string,
  value: string,
  brands: FilmBrand[]
): string {
  switch (paramKey) {
    case "type":
      return FILM_TYPE_LABELS[value as keyof typeof FILM_TYPE_LABELS] ?? value;
    case "format":
      return value;
    case "iso":
      return value;
    case "grain":
      return GRAIN_LABELS[value as keyof typeof GRAIN_LABELS] ?? value;
    case "contrast":
      return CONTRAST_LABELS[value as keyof typeof CONTRAST_LABELS] ?? value;
    case "latitude":
      return LATITUDE_LABELS[value as keyof typeof LATITUDE_LABELS] ?? value;
    case "saturation":
      return SATURATION_LABELS[value as keyof typeof SATURATION_LABELS] ?? value;
    case "brand":
      return brands.find((b) => b.slug === value)?.name ?? value;
    case "bestFor":
      return BEST_FOR_LABELS[value as keyof typeof BEST_FOR_LABELS] ?? value;
    default:
      return value;
  }
}

/** For ISO, get the effective "first" value for single-label display (8-80 or first iso). */
function getFirstIsoValue(searchParams: URLSearchParams): string {
  const arr = getParamArray(searchParams, "iso");
  if (ISO_8_80_VALUES.every((v) => arr.includes(v))) return "8-80";
  return arr[0] ?? "";
}

function openFiltersWithCategory(category: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openFilmsAllFilters", { detail: { category } }));
  }
}

interface SearchCategoryPillsProps {
  brands?: FilmBrand[];
  filterOptions?: FilmFilterOptions | null;
}

/** Category filter pills: when 1 filter, show [Filter label (1) ▼]; when 2+, show [Category (N) ▼]. Tap opens drawer with that category expanded. */
export function SearchCategoryPills({ brands = [], filterOptions }: SearchCategoryPillsProps) {
  const searchParams = useSearchParams();

  const sortValue = searchParams.get("sort") === "popular" ? "popular" : "alphabetical";

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {CATEGORIES.map(({ key, label, paramKey }) => {
        const isSort = paramKey === "sort";
        const values = getParamArray(searchParams, paramKey);
        const count = getCategoryCount(searchParams, paramKey);
        const active = isSort ? false : count > 0;
        const singleValue =
          !isSort && count === 1
            ? paramKey === "iso"
              ? getFirstIsoValue(searchParams)
              : values[0] ?? ""
            : "";
        const displayLabel = isSort
          ? sortValue === "popular"
            ? "Popularity"
            : "A-Z"
          : count === 1 && singleValue
            ? getSingleValueLabel(paramKey, singleValue, brands)
            : label;
        return (
          <button
            key={key}
            type="button"
            onClick={() => openFiltersWithCategory(key)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors last:mr-4 sm:last:mr-6 lg:last:mr-8",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50"
            )}
          >
            <span className="truncate max-w-[140px]">
              {displayLabel}
              {active && (
                <span className="ml-1 tabular-nums">
                  ({count})
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
