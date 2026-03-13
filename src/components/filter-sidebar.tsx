"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { FilmBrand, FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor } from "@/lib/types";
import type { FilmFilterOptions, IsoFilterOption } from "@/lib/supabase/queries";
import { FILM_TYPE_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, SATURATION_LABELS, BEST_FOR_LABELS } from "@/lib/types";
import { ChevronDown } from "lucide-react";

interface FilterSidebarProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
}

function getParamArray(searchParams: URLSearchParams, key: string): string[] {
  const v = searchParams.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export function FilterSidebar({ brands, filterOptions }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      router.push(`/films?${params.toString()}`);
    },
    [router, searchParams]
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
    router.push(`/films?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="space-y-1">
      <nav className="flex flex-col gap-0" aria-label="Filters">
        <FilterAccordion defaultOpen title="Type">
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

        <FilterAccordion defaultOpen={false} title="Format">
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

        <FilterAccordion defaultOpen={false} title="ISO">
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

        <FilterAccordion defaultOpen={false} title="Grain">
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

        <FilterAccordion defaultOpen={false} title="Contrast">
          <FilterPillGrid>
            {filterOptions.contrasts.map((level) => (
              <FilterPill
                key={level}
                label={CONTRAST_LABELS[level]}
                selected={selectedContrasts.includes(level)}
                onToggle={() => toggleMulti("contrast", level)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} title="Latitude">
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

        <FilterAccordion defaultOpen={false} title="Saturation">
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

        <FilterAccordion defaultOpen={false} title="Brand">
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

        <FilterAccordion defaultOpen={false} title="Use case">
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
      </nav>
    </div>
  );
}

function FilterAccordion({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-2 pb-4">
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
      className={`inline-flex min-w-0 items-center justify-center rounded-[6px] border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/60 bg-secondary/30 text-foreground hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
