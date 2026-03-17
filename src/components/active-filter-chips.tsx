"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FilmBrand, FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor, DiscoveryVibe } from "@/lib/types";
import { FILM_TYPE_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, SATURATION_LABELS, BEST_FOR_LABELS, DISCOVERY_VIBE_LABELS } from "@/lib/types";
import { X } from "lucide-react";

/** bestFor sets used by Discovery pills — when URL matches one of these, we hide bestFor chips. */
const DISCOVERY_PILL_BEST_FOR_SETS: string[][] = [
  ["golden_hour", "landscapes"].sort(),
  ["portrait", "weddings"].sort(),
  ["street", "documentary"].sort(),
  ["artificial_light", "low_light"].sort(),
  ["landscapes", "bright_sun"].sort(),
  ["general_purpose"].sort(),
  ["travel"].sort(),
  ["experimental"].sort(),
];

function getParamArray(searchParams: URLSearchParams, key: string): string[] {
  const v = searchParams.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function bestForMatchesDiscoveryPill(selectedBestFor: string[]): boolean {
  if (selectedBestFor.length === 0) return false;
  const sorted = [...selectedBestFor].sort();
  return DISCOVERY_PILL_BEST_FOR_SETS.some(
    (set) => set.length === sorted.length && set.every((v, i) => v === sorted[i])
  );
}

function removeParamValue(
  searchParams: URLSearchParams,
  key: string,
  value: string
): string {
  const params = new URLSearchParams(searchParams.toString());
  const current = getParamArray(params, key);
  const next = current.filter((x) => x !== value);
  if (next.length === 0) {
    params.delete(key);
  } else {
    params.set(key, next.join(","));
  }
  return params.toString();
}

interface Chip {
  key: string;
  value: string;
  label: string;
}

interface ActiveFilterChipsProps {
  brands: FilmBrand[];
}

export function ActiveFilterChips({ brands }: ActiveFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/films";
  const searchParams = useSearchParams();
  const basePath = pathname.startsWith("/search") ? "/search" : "/films";

  const selectedTypes = getParamArray(searchParams, "type");
  const selectedFormats = getParamArray(searchParams, "format");
  const selectedGrains = getParamArray(searchParams, "grain");
  const selectedContrasts = getParamArray(searchParams, "contrast");
  const selectedLatitudes = getParamArray(searchParams, "latitude");
  const selectedSaturations = getParamArray(searchParams, "saturation");
  const selectedBrands = getParamArray(searchParams, "brand");
  const selectedBestFor = getParamArray(searchParams, "bestFor");
  const selectedIsos = getParamArray(searchParams, "iso");
  const vibe = searchParams.get("vibe");
  const hideBestForChips = bestForMatchesDiscoveryPill(selectedBestFor);

  const chips: Chip[] = [
    ...(vibe && vibe in DISCOVERY_VIBE_LABELS
      ? [{ key: "vibe", value: vibe, label: DISCOVERY_VIBE_LABELS[vibe as DiscoveryVibe] }]
      : []),
    ...selectedTypes.map((value) => ({
      key: "type",
      value,
      label: FILM_TYPE_LABELS[value as FilmType] ?? value,
    })),
    ...selectedFormats.map((value) => ({
      key: "format",
      value,
      label: value,
    })),
    ...selectedGrains.map((value) => ({
      key: "grain",
      value,
      label: `Grain: ${GRAIN_LABELS[value as GrainFilter] ?? value}`,
    })),
    ...selectedContrasts.map((value) => ({
      key: "contrast",
      value,
      label: `Contrast: ${CONTRAST_LABELS[value as ContrastFilter] ?? value}`,
    })),
    ...selectedLatitudes.map((value) => ({
      key: "latitude",
      value,
      label: `Latitude: ${LATITUDE_LABELS[value as LatitudeFilter] ?? value}`,
    })),
    ...selectedSaturations.map((value) => ({
      key: "saturation",
      value,
      label: `Saturation: ${SATURATION_LABELS[value as SaturationFilter] ?? value}`,
    })),
    ...selectedBrands.map((slug) => ({
      key: "brand",
      value: slug,
      label: brands.find((b) => b.slug === slug)?.name ?? slug,
    })),
    ...(hideBestForChips ? [] : selectedBestFor.map((value) => ({
      key: "bestFor",
      value,
      label: BEST_FOR_LABELS[value as BestFor] ?? value,
    }))),
    ...selectedIsos.map((value) => ({
      key: "iso",
      value,
      label: `ISO ${value}`,
    })),
  ];

  if (chips.length === 0) return null;

  function remove(key: string, value: string) {
    const q = removeParamValue(searchParams, key, value);
    router.push(q ? `${basePath}?${q}` : basePath);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map(({ key, value, label }) => (
        <button
          key={`${key}-${value}`}
          type="button"
          onClick={() => remove(key, value)}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/50 pl-2.5 pr-1.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="truncate max-w-[var(--width-chip-label)]">{label}</span>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary">
            <X className="h-3 w-3" aria-hidden />
          </span>
        </button>
      ))}
    </div>
  );
}
