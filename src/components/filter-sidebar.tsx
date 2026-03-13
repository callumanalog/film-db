"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { FilmBrand, FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";
import { FILM_TYPE_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, SATURATION_LABELS, BEST_FOR_LABELS } from "@/lib/types";
import {
  ChevronDown,
  Palette,
  Gauge,
  ScanLine,
  Contrast as ContrastIcon,
  Building2,
  UserCircle,
  Mountain,
  Heart,
  Plane,
  Moon,
  LampDesk,
  Sun,
  SunDim,
  Trophy,
  Sparkles,
  Aperture,
  Film,
  Maximize2,
  Droplets,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BEST_FOR_ICONS: Record<BestFor, LucideIcon> = {
  portrait: UserCircle,
  landscape: Mountain,
  street: Building2,
  wedding: Heart,
  travel: Plane,
  night: Moon,
  studio: LampDesk,
  everyday: Sun,
  sports: Trophy,
  sunny_conditions: SunDim,
  creative: Sparkles,
};

const TYPE_ICONS: Record<FilmType, LucideIcon> = {
  color_negative: Palette,
  color_reversal: Palette,
  bw_negative: ContrastIcon,
  bw_reversal: ContrastIcon,
  instant: Film,
};

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

  return (
    <div className="space-y-1">
      <nav className="flex flex-col gap-0" aria-label="Filters">
        <FilterAccordion defaultOpen twoColumns={false} title="Type">
          <FilterPillGrid>
            {filterOptions.types.map((type) => (
              <FilterPill
                key={type}
                icon={TYPE_ICONS[type]}
                label={FILM_TYPE_LABELS[type]}
                selected={selectedTypes.includes(type)}
                onToggle={() => toggleMulti("type", type)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={false} title="Format">
          <FilterPillGrid>
            {filterOptions.formats.map((format) => (
              <FilterPill
                key={format}
                icon={Aperture}
                label={format}
                selected={selectedFormats.includes(format)}
                onToggle={() => toggleMulti("format", format)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={true} title="ISO">
          <FilterPillGrid>
            {filterOptions.isos.map((iso) => (
              <FilterPill
                key={iso}
                icon={Gauge}
                label={String(iso)}
                selected={selectedIsos.includes(String(iso))}
                onToggle={() => toggleMulti("iso", String(iso))}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={false} title="Grain">
          <FilterPillGrid>
            {filterOptions.grains.map((level) => (
              <FilterPill
                key={level}
                icon={ScanLine}
                label={GRAIN_LABELS[level]}
                selected={selectedGrains.includes(level)}
                onToggle={() => toggleMulti("grain", level)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={false} title="Contrast">
          <FilterPillGrid>
            {filterOptions.contrasts.map((level) => (
              <FilterPill
                key={level}
                icon={ContrastIcon}
                label={CONTRAST_LABELS[level]}
                selected={selectedContrasts.includes(level)}
                onToggle={() => toggleMulti("contrast", level)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={false} title="Latitude">
          <FilterPillGrid>
            {filterOptions.latitudes.map((level) => (
              <FilterPill
                key={level}
                icon={Maximize2}
                label={LATITUDE_LABELS[level]}
                selected={selectedLatitudes.includes(level)}
                onToggle={() => toggleMulti("latitude", level)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={false} title="Saturation">
          <FilterPillGrid>
            {filterOptions.saturations.map((level) => (
              <FilterPill
                key={level}
                icon={Droplets}
                label={SATURATION_LABELS[level]}
                selected={selectedSaturations.includes(level)}
                onToggle={() => toggleMulti("saturation", level)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={false} title="Brand">
          <FilterPillGrid>
            {brands.map((brand) => (
              <FilterPill
                key={brand.slug}
                icon={Building2}
                label={brand.name}
                selected={selectedBrands.includes(brand.slug)}
                onToggle={() => toggleMulti("brand", brand.slug)}
              />
            ))}
          </FilterPillGrid>
        </FilterAccordion>

        <FilterAccordion defaultOpen={false} twoColumns={false} title="Use case">
          <FilterPillGrid>
            {filterOptions.bestFor.map((bf) => (
              <FilterPill
                key={bf}
                icon={BEST_FOR_ICONS[bf]}
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
  twoColumns,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  twoColumns: boolean;
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
        <div
          className={`grid gap-2 pb-4 ${twoColumns ? "grid-cols-2" : "grid-cols-1"}`}
        >
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
  icon: Icon,
  label,
  selected,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/60 bg-secondary/30 text-foreground hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
