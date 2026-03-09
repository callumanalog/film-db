"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import type { FilmBrand, FilmType, FilmFormat, GrainLevel, ContrastLevel, BestFor } from "@/lib/types";
import { FILM_TYPE_LABELS, GRAIN_LABELS, CONTRAST_LABELS, BEST_FOR_LABELS } from "@/lib/types";
import { X, ChevronDown, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  brands: FilmBrand[];
}

const FORMATS: FilmFormat[] = ["35mm", "120", "4x5", "8x10"];
const FILM_TYPES: FilmType[] = [
  "color_negative",
  "color_reversal",
  "bw_negative",
  "bw_reversal",
];
const GRAIN_LEVELS: GrainLevel[] = ["fine", "medium", "heavy"];
const CONTRAST_LEVELS: ContrastLevel[] = ["low", "medium", "high"];
const BEST_FOR_OPTIONS: BestFor[] = [
  "portrait",
  "landscape",
  "street",
  "wedding",
  "travel",
  "night",
  "studio",
  "everyday",
];
const ISO_RANGES = [
  { label: "50–100", min: "50", max: "100" },
  { label: "200", min: "200", max: "200" },
  { label: "400", min: "400", max: "400" },
  { label: "800+", min: "800", max: "3200" },
];

export function FilterSidebar({ brands }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBrand = searchParams.get("brand") || "";
  const currentType = searchParams.get("type") || "";
  const currentFormat = searchParams.get("format") || "";
  const currentGrain = searchParams.get("grain") || "";
  const currentContrast = searchParams.get("contrast") || "";
  const currentBestFor = searchParams.get("bestFor") || "";
  const currentIsoMin = searchParams.get("isoMin") || "";
  const currentIsoMax = searchParams.get("isoMax") || "";
  const currentSearch = searchParams.get("search") || "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/films?${params.toString()}`);
    },
    [router, searchParams]
  );

  const updateMultipleFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/films?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push("/films");
  }, [router]);

  const activeFilters: { key: string; label: string }[] = [];
  if (currentBrand) {
    const brand = brands.find((b) => b.slug === currentBrand);
    activeFilters.push({ key: "brand", label: brand?.name || currentBrand });
  }
  if (currentType) activeFilters.push({ key: "type", label: FILM_TYPE_LABELS[currentType as FilmType] || currentType });
  if (currentFormat) activeFilters.push({ key: "format", label: currentFormat });
  if (currentGrain) activeFilters.push({ key: "grain", label: `${GRAIN_LABELS[currentGrain as GrainLevel]} grain` });
  if (currentContrast) activeFilters.push({ key: "contrast", label: `${CONTRAST_LABELS[currentContrast as ContrastLevel]} contrast` });
  if (currentBestFor) activeFilters.push({ key: "bestFor", label: BEST_FOR_LABELS[currentBestFor as BestFor] || currentBestFor });
  if (currentIsoMin || currentIsoMax) {
    const isoRange = ISO_RANGES.find((r) => r.min === currentIsoMin && r.max === currentIsoMax);
    activeFilters.push({ key: "iso", label: `ISO ${isoRange?.label || `${currentIsoMin}–${currentIsoMax}`}` });
  }
  if (currentSearch) activeFilters.push({ key: "search", label: `"${currentSearch}"` });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </div>

        <FilterDropdown
          label="Brand"
          active={!!currentBrand}
        >
          <DropdownOption
            selected={!currentBrand}
            onClick={() => updateFilter("brand", "")}
          >
            All Brands
          </DropdownOption>
          {brands.map((brand) => (
            <DropdownOption
              key={brand.slug}
              selected={currentBrand === brand.slug}
              onClick={() => updateFilter("brand", brand.slug)}
            >
              {brand.name}
            </DropdownOption>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="Type"
          active={!!currentType}
        >
          <DropdownOption
            selected={!currentType}
            onClick={() => updateFilter("type", "")}
          >
            All Types
          </DropdownOption>
          {FILM_TYPES.map((type) => (
            <DropdownOption
              key={type}
              selected={currentType === type}
              onClick={() => updateFilter("type", type)}
            >
              {FILM_TYPE_LABELS[type]}
            </DropdownOption>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="Format"
          active={!!currentFormat}
        >
          <DropdownOption
            selected={!currentFormat}
            onClick={() => updateFilter("format", "")}
          >
            All Formats
          </DropdownOption>
          {FORMATS.map((format) => (
            <DropdownOption
              key={format}
              selected={currentFormat === format}
              onClick={() => updateFilter("format", format)}
            >
              {format}
            </DropdownOption>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="Best For"
          active={!!currentBestFor}
        >
          <DropdownOption
            selected={!currentBestFor}
            onClick={() => updateFilter("bestFor", "")}
          >
            Any Use
          </DropdownOption>
          {BEST_FOR_OPTIONS.map((bf) => (
            <DropdownOption
              key={bf}
              selected={currentBestFor === bf}
              onClick={() => updateFilter("bestFor", bf)}
            >
              {BEST_FOR_LABELS[bf]}
            </DropdownOption>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="ISO"
          active={!!(currentIsoMin || currentIsoMax)}
        >
          <DropdownOption
            selected={!currentIsoMin && !currentIsoMax}
            onClick={() => updateMultipleFilters({ isoMin: "", isoMax: "" })}
          >
            Any ISO
          </DropdownOption>
          {ISO_RANGES.map((range) => (
            <DropdownOption
              key={range.label}
              selected={currentIsoMin === range.min && currentIsoMax === range.max}
              onClick={() => updateMultipleFilters({ isoMin: range.min, isoMax: range.max })}
            >
              ISO {range.label}
            </DropdownOption>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="Grain"
          active={!!currentGrain}
        >
          <DropdownOption
            selected={!currentGrain}
            onClick={() => updateFilter("grain", "")}
          >
            Any Grain
          </DropdownOption>
          {GRAIN_LEVELS.map((level) => (
            <DropdownOption
              key={level}
              selected={currentGrain === level}
              onClick={() => updateFilter("grain", level)}
            >
              {GRAIN_LABELS[level]}
            </DropdownOption>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="Contrast"
          active={!!currentContrast}
        >
          <DropdownOption
            selected={!currentContrast}
            onClick={() => updateFilter("contrast", "")}
          >
            Any Contrast
          </DropdownOption>
          {CONTRAST_LEVELS.map((level) => (
            <DropdownOption
              key={level}
              selected={currentContrast === level}
              onClick={() => updateFilter("contrast", level)}
            >
              {CONTRAST_LABELS[level]}
            </DropdownOption>
          ))}
        </FilterDropdown>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => {
                if (filter.key === "iso") {
                  updateMultipleFilters({ isoMin: "", isoMax: "" });
                } else {
                  updateFilter(filter.key, "");
                }
              }}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {filter.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterDropdown({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          active
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:bg-accent"
        }`}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border bg-card p-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownOption({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
        selected
          ? "bg-primary/15 font-medium text-primary"
          : "text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
