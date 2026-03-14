"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CameraBrand, CameraType, CameraFormat } from "@/lib/types";
import { CAMERA_TYPE_LABELS } from "@/lib/types";

const CAMERA_FORMAT_LABELS: Record<CameraFormat, string> = {
  "35mm": "35mm",
  "120": "120",
  "4x5": "4×5",
  "8x10": "8×10",
  "110": "110",
  instant: "Instant",
  "127": "127",
  "220": "220",
  "620": "620",
};

const CAMERA_TYPES: CameraType[] = [
  "slr",
  "rangefinder",
  "tlr",
  "point_and_shoot",
  "viewfinder",
  "medium_format_slr",
  "medium_format_rangefinder",
  "instant",
  "large_format",
  "folding",
  "toy",
];

const CAMERA_FORMATS: CameraFormat[] = ["35mm", "120", "4x5", "8x10", "instant"];

interface CameraFilterSidebarProps {
  brands: CameraBrand[];
}

export function CameraFilterSidebar({ brands }: CameraFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBrand = searchParams.get("brand") ?? "";
  const currentType = searchParams.get("type") ?? "";
  const currentFormat = searchParams.get("format") ?? "";

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value == null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const q = params.toString();
    router.push(q ? `/cameras?${q}` : "/cameras");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Brand
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setParam("brand", null)}
            className={`rounded-card px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !currentBrand
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            All
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setParam("brand", currentBrand === b.slug ? "" : b.slug)}
              className={`rounded-card px-2.5 py-1.5 text-xs font-medium transition-colors ${
                currentBrand === b.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Type
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setParam("type", null)}
            className={`rounded-card px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !currentType
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            All
          </button>
          {CAMERA_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setParam("type", currentType === type ? "" : type)}
              className={`rounded-card px-2.5 py-1.5 text-xs font-medium transition-colors ${
                currentType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {CAMERA_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Format
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setParam("format", null)}
            className={`rounded-card px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !currentFormat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            All
          </button>
          {CAMERA_FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => setParam("format", currentFormat === format ? "" : format)}
              className={`rounded-card px-2.5 py-1.5 text-xs font-medium transition-colors ${
                currentFormat === format
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {CAMERA_FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
