"use client";

import { useRouter, useSearchParams } from "next/navigation";

function getParamArray(searchParams: URLSearchParams, key: string): string[] {
  const v = searchParams.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export function ClearFiltersLink() {
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

  const hasAnyFilter =
    selectedBrands.length > 0 ||
    selectedTypes.length > 0 ||
    selectedFormats.length > 0 ||
    selectedGrains.length > 0 ||
    selectedContrasts.length > 0 ||
    selectedLatitudes.length > 0 ||
    selectedSaturations.length > 0 ||
    selectedBestFor.length > 0 ||
    selectedIsos.length > 0;

  if (!hasAnyFilter) return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/films")}
      className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      Clear all filters
    </button>
  );
}
