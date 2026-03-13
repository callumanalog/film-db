"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FilmBrand, FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor } from "@/lib/types";
import { FILM_TYPE_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, SATURATION_LABELS, BEST_FOR_LABELS } from "@/lib/types";
import { X } from "lucide-react";

function getParamArray(searchParams: URLSearchParams, key: string): string[] {
  const v = searchParams.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
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
  const searchParams = useSearchParams();

  const selectedTypes = getParamArray(searchParams, "type");
  const selectedFormats = getParamArray(searchParams, "format");
  const selectedGrains = getParamArray(searchParams, "grain");
  const selectedContrasts = getParamArray(searchParams, "contrast");
  const selectedLatitudes = getParamArray(searchParams, "latitude");
  const selectedSaturations = getParamArray(searchParams, "saturation");
  const selectedBrands = getParamArray(searchParams, "brand");
  const selectedBestFor = getParamArray(searchParams, "bestFor");
  const selectedIsos = getParamArray(searchParams, "iso");

  const chips: Chip[] = [
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
      label: GRAIN_LABELS[value as GrainFilter] ?? value,
    })),
    ...selectedContrasts.map((value) => ({
      key: "contrast",
      value,
      label: CONTRAST_LABELS[value as ContrastFilter] ?? value,
    })),
    ...selectedLatitudes.map((value) => ({
      key: "latitude",
      value,
      label: LATITUDE_LABELS[value as LatitudeFilter] ?? value,
    })),
    ...selectedSaturations.map((value) => ({
      key: "saturation",
      value,
      label: SATURATION_LABELS[value as SaturationFilter] ?? value,
    })),
    ...selectedBrands.map((slug) => ({
      key: "brand",
      value: slug,
      label: brands.find((b) => b.slug === slug)?.name ?? slug,
    })),
    ...selectedBestFor.map((value) => ({
      key: "bestFor",
      value,
      label: BEST_FOR_LABELS[value as BestFor] ?? value,
    })),
    ...selectedIsos.map((value) => ({
      key: "iso",
      value,
      label: `ISO ${value}`,
    })),
  ];

  if (chips.length === 0) return null;

  function remove(key: string, value: string) {
    const q = removeParamValue(searchParams, key, value);
    router.push(q ? `/films?${q}` : "/films");
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
          <span className="truncate max-w-[120px]">{label}</span>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary">
            <X className="h-3 w-3" aria-hidden />
          </span>
        </button>
      ))}
    </div>
  );
}
