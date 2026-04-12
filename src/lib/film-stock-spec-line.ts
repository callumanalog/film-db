import type { FilmType } from "@/lib/types";
import { FILM_TYPE_LABELS } from "@/lib/types";

/** Second line on browse list cards: TYPE · ISO · FORMATS */
export function buildFilmStockTypeSpecLine(type?: string, iso?: number | null, format?: string[]): string {
  const typeStr = type ? (FILM_TYPE_LABELS[type as FilmType] ?? "—").toUpperCase() : "—";
  const isoStr = iso != null ? `ISO ${iso}` : "ISO —";
  const formats = format ?? [];
  const formatStr = formats.length ? formats.map((f) => f.toUpperCase()).join(", ") : "—";
  return `${typeStr} · ${isoStr} · ${formatStr}`;
}

function uniqueFormatsInOrder(formats: string[] | undefined): string[] {
  if (!formats?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of formats) {
    const t = typeof f === "string" ? f.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Upload modal / lightbox stock row: BRAND · ISO · FORMATS */
export function buildFilmStockBrandMetaLine(brandName: string, iso?: number | null, format?: string[]): string {
  const isoText = iso != null ? `ISO ${iso}` : "ISO —";
  const formatText = uniqueFormatsInOrder(format).map((f) => f.toUpperCase()).join(", ") || "—";
  return `${brandName.trim().toUpperCase()} · ${isoText} · ${formatText}`;
}
