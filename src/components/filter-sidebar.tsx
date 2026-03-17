"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef, startTransition } from "react";
import type { FilmBrand, FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor } from "@/lib/types";
import type { FilmFilterOptions, IsoFilterOption } from "@/lib/supabase/queries";
import { FILM_TYPE_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, SATURATION_LABELS, BEST_FOR_LABELS } from "@/lib/types";
import { ChevronDown } from "lucide-react";

interface FilterSidebarProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
  /** "drawer" = pills + accordions (mobile drawer). "specs" = specs-style table with same pills (desktop left pane). */
  variant?: "drawer" | "specs";
  /** When false, Type accordion starts closed (e.g. when Vibes is first in drawer). Default true. */
  typeDefaultOpen?: boolean;
  /** When set, the accordion with this title starts open (e.g. "Type", "Format"). */
  initialOpenCategory?: string;
}

function getParamArray(searchParams: URLSearchParams, key: string): string[] {
  const v = searchParams.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export function FilterSidebar({ brands, filterOptions, variant = "drawer", typeDefaultOpen = true, initialOpenCategory }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/films";
  const searchParams = useSearchParams();
  const basePath = pathname.startsWith("/search") ? "/search" : "/films";

  const selectedBrands = getParamArray(searchParams, "brand");
  const selectedTypes = getParamArray(searchParams, "type");
  const selectedFormats = getParamArray(searchParams, "format");
  const selectedGrains = getParamArray(searchParams, "grain");
  const selectedContrasts = getParamArray(searchParams, "contrast");
  const selectedLatitudes = getParamArray(searchParams, "latitude");
  const selectedSaturations = getParamArray(searchParams, "saturation");
  const selectedBestFor = getParamArray(searchParams, "bestFor");
  const selectedIsos = getParamArray(searchParams, "iso");

  const ISO_8_80_VALUES = ["8", "12", "20", "25", "50", "80"];
  const iso8_80Selected = ISO_8_80_VALUES.every((v) => selectedIsos.includes(v));
  const isoCount = (iso8_80Selected ? 1 : 0) + selectedIsos.filter((v) => !ISO_8_80_VALUES.includes(v)).length;

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = getParamArray(params, key);
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      if (next.length === 0) {
        params.delete(key);
      } else {
        params.set(key, next.join(","));
      }
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, searchParams, basePath]
  );

  const toggleIso8_80 = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const current = getParamArray(params, "iso");
    const all8_80Selected = ISO_8_80_VALUES.every((v) => current.includes(v));
    const next = all8_80Selected
      ? current.filter((x) => !ISO_8_80_VALUES.includes(x))
      : [...current.filter((x) => !ISO_8_80_VALUES.includes(x)), ...ISO_8_80_VALUES];
    if (next.length === 0) {
      params.delete("iso");
    } else {
      params.set("iso", next.join(","));
    }
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }, [router, searchParams, basePath]);

  const sort = searchParams.get("sort") === "popular" ? "popular" : "alphabetical";
  const setSort = useCallback(
    (value: "alphabetical" | "popular") => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "alphabetical") {
        params.delete("sort");
      } else {
        params.set("sort", "popular");
      }
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, searchParams, basePath]
  );

  const accordionContent = (
    <>
      <FilterAccordion defaultOpen={initialOpenCategory === "Sort"} scrollIntoViewWhenOpen={variant === "drawer"} title="Sort">
        <FilterPillGrid>
          <FilterPill
            label="A-Z"
            selected={sort === "alphabetical"}
            onToggle={() => setSort("alphabetical")}
          />
          <FilterPill
            label="Popularity"
            selected={sort === "popular"}
            onToggle={() => setSort("popular")}
          />
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "Format"} scrollIntoViewWhenOpen={variant === "drawer"} title="Format" >
        <FilterPillGrid>
          {filterOptions.formats.map((format) => (
            <FilterPill
              key={format}
              label={format}
              selected={selectedFormats.includes(format)}
              onToggle={() => toggleMulti("format", format)}
            />
          ))}
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "ISO"} scrollIntoViewWhenOpen={variant === "drawer"} title="ISO" >
        <FilterPillGrid>
          {filterOptions.isos.map((iso: IsoFilterOption) =>
            iso === "8-80" ? (
              <FilterPill
                key="8-80"
                label="8-80"
                selected={ISO_8_80_VALUES.every((v) => selectedIsos.includes(v))}
                onToggle={toggleIso8_80}
              />
            ) : (
              <FilterPill
                key={iso}
                label={String(iso)}
                selected={selectedIsos.includes(String(iso))}
                onToggle={() => toggleMulti("iso", String(iso))}
              />
            )
          )}
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "Type" || typeDefaultOpen} scrollIntoViewWhenOpen={variant === "drawer"} singleColumn={variant === "specs"} title="Type">
        <FilterPillGrid>
          {filterOptions.types.map((type) => (
            <FilterPill
              key={type}
              label={FILM_TYPE_LABELS[type]}
              selected={selectedTypes.includes(type)}
              onToggle={() => toggleMulti("type", type)}
            />
          ))}
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "Brand"} scrollIntoViewWhenOpen={variant === "drawer"} singleColumn={variant === "specs"} title="Brand">
        <FilterPillGrid>
          {brands.map((brand) => (
            <FilterPill
              key={brand.slug}
              label={brand.name}
              selected={selectedBrands.includes(brand.slug)}
              onToggle={() => toggleMulti("brand", brand.slug)}
            />
          ))}
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "Use case"} scrollIntoViewWhenOpen={variant === "drawer"} singleColumn={variant === "specs"} title="Use case">
        <FilterPillGrid>
          {filterOptions.bestFor.map((bf) => (
            <FilterPill
              key={bf}
              label={BEST_FOR_LABELS[bf]}
              selected={selectedBestFor.includes(bf)}
              onToggle={() => toggleMulti("bestFor", bf)}
            />
          ))}
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "Latitude"} scrollIntoViewWhenOpen={variant === "drawer"} title="Latitude" >
        <FilterPillGrid>
          {filterOptions.latitudes.map((level) => (
            <FilterPill
              key={level}
              label={LATITUDE_LABELS[level]}
              selected={selectedLatitudes.includes(level)}
              onToggle={() => toggleMulti("latitude", level)}
            />
          ))}
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "Grain"} scrollIntoViewWhenOpen={variant === "drawer"} title="Grain">
        <FilterPillGrid>
          {filterOptions.grains.map((level) => (
            <FilterPill
              key={level}
              label={GRAIN_LABELS[level]}
              selected={selectedGrains.includes(level)}
              onToggle={() => toggleMulti("grain", level)}
            />
          ))}
        </FilterPillGrid>
      </FilterAccordion>
      <FilterAccordion defaultOpen={initialOpenCategory === "Saturation"} scrollIntoViewWhenOpen={variant === "drawer"} title="Saturation" >
        <FilterPillGrid>
          {filterOptions.saturations.map((level) => (
            <FilterPill
              key={level}
              label={SATURATION_LABELS[level]}
              selected={selectedSaturations.includes(level)}
              onToggle={() => toggleMulti("saturation", level)}
            />
          ))}
        </FilterPillGrid>
      </FilterAccordion>
    </>
  );

  if (variant === "specs") {
    return (
      <nav className="flex flex-col gap-0" aria-label="Filters">
        <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card">
          <div className="space-y-1 px-4 pb-4 pt-0">{accordionContent}</div>
        </div>
      </nav>
    );
  }

  return (
    <div className="space-y-1">
      <nav className="flex flex-col gap-0" aria-label="Filters">
        {accordionContent}
      </nav>
    </div>
  );
}

function FilterAccordion({
  title,
  defaultOpen,
  singleColumn = false,
  scrollIntoViewWhenOpen = false,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  /** When true, pills layout in one column instead of two */
  singleColumn?: boolean;
  /** When true (e.g. in sheet), scroll this accordion into view when opened so all buttons stay above fixed footer */
  scrollIntoViewWhenOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const accordionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !scrollIntoViewWhenOpen) return;
    const t = setTimeout(() => {
      accordionRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }, 200);
    return () => clearTimeout(t);
  }, [open, scrollIntoViewWhenOpen]);

  return (
    <div ref={accordionRef} className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="label-caps flex w-full items-center justify-between gap-2 py-4 text-left hover:text-foreground"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className={`flex flex-wrap gap-2 pb-4 ${singleColumn ? "flex-col" : ""}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function FilterPillGrid({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function FilterPill({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-11 min-w-0 shrink-0 items-center justify-center rounded-[6px] border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/60 bg-secondary/30 text-foreground hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

