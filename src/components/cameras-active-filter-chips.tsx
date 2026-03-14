"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CameraBrand, CameraType, CameraFormat } from "@/lib/types";
import { CAMERA_TYPE_LABELS } from "@/lib/types";
import { X } from "lucide-react";

const CAMERA_FORMAT_LABELS: Record<string, string> = {
  "35mm": "35mm",
  "120": "120",
  "4x5": "4×5",
  "8x10": "8×10",
  instant: "Instant",
};

interface CamerasActiveFilterChipsProps {
  brands: CameraBrand[];
}

export function CamerasActiveFilterChips({ brands }: CamerasActiveFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const type = searchParams.get("type") ?? "";
  const format = searchParams.get("format") ?? "";

  const chips: { key: string; value: string; label: string }[] = [];
  if (search) {
    chips.push({ key: "search", value: search, label: `Search: ${search}` });
  }
  if (brand) {
    const label = brands.find((b) => b.slug === brand)?.name ?? brand;
    chips.push({ key: "brand", value: brand, label });
  }
  if (type) {
    chips.push({
      key: "type",
      value: type,
      label: CAMERA_TYPE_LABELS[type as CameraType] ?? type,
    });
  }
  if (format) {
    chips.push({
      key: "format",
      value: format,
      label: CAMERA_FORMAT_LABELS[format] ?? format,
    });
  }

  if (chips.length === 0) return null;

  function remove(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "search") {
      params.delete("search");
    } else {
      params.delete(key);
    }
    const q = params.toString();
    router.push(q ? `/cameras?${q}` : "/cameras");
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
