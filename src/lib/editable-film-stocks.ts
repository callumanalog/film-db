/**
 * Editable film stocks: when data/film-stocks.json exists, the app uses it instead of seed-data.
 * Use the admin UI at /admin/films to edit; "Save" writes here. Delete this file to revert to seed.
 */

import type { FilmStock, ShootingNote } from "@/lib/types";
import { scaleToGrainFilter, scaleToContrastFilter, scaleToLatitudeFilter, scaleToSaturationFilter } from "@/lib/types";

const FILM_STOCKS_PATH = "data/film-stocks.json";

function getDataPath(): string | null {
  if (typeof process === "undefined" || !process.cwd) return null;
  try {
    const path = require("path");
    return path.join(process.cwd(), FILM_STOCKS_PATH);
  } catch {
    return null;
  }
}

/** Map legacy word values to scale 1–5 for migration from old file shape. */
function legacyGrainToScale(v: unknown): number | null {
  if (v === "fine") return 1;
  if (v === "medium") return 3;
  if (v === "strong") return 5;
  return null;
}
function legacyContrastToScale(v: unknown): number | null {
  if (v === "low") return 1;
  if (v === "medium") return 3;
  if (v === "high") return 5;
  return null;
}
function legacyLatitudeToScale(v: unknown): number | null {
  if (v === "very_narrow") return 1;
  if (v === "narrow") return 2;
  if (v === "moderate") return 3;
  if (v === "wide") return 4;
  if (v === "very_wide") return 5;
  return null;
}

/** Parse saturation scale 1–5 from JSON/seed (number or numeric string). */
function parseSaturationScale(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim());
    if (Number.isInteger(n) && n >= 1 && n <= 5) return n;
  }
  return null;
}

/** Normalize a row (from file or seed) to FilmStock (new schema: grain/contrast/latitude/saturation 1–5, shooting_notes). */
export function normalizeFilmStockFromFile(row: Record<string, unknown>): FilmStock {
  const grain = typeof row.grain === "number" ? row.grain : legacyGrainToScale(row.grain_level ?? row.grain);
  const contrast = typeof row.contrast === "number" ? row.contrast : legacyContrastToScale(row.contrast_level ?? row.contrast);
  const latitude = typeof row.latitude === "number" ? row.latitude : legacyLatitudeToScale(row.latitude_level ?? row.latitude);
  const saturation = parseSaturationScale(row.saturation);
  let shooting_notes: ShootingNote[] = [];
  if (Array.isArray(row.shooting_notes) && row.shooting_notes.every((n) => n && typeof n === "object")) {
    shooting_notes = (row.shooting_notes as { header?: string; dek?: string }[]).map((n) => ({
      header: typeof n.header === "string" ? n.header : "",
      dek: typeof n.dek === "string" ? n.dek : "",
    }));
  } else if (row.shooting_tips != null && String(row.shooting_tips).trim() !== "") {
    shooting_notes = [{ header: "", dek: String(row.shooting_tips).trim() }];
  }
  return {
    ...row,
    grain: grain ?? null,
    contrast: contrast ?? null,
    latitude: latitude ?? null,
    saturation,
    shooting_notes,
    grain_level: scaleToGrainFilter(grain) ?? "medium",
    contrast_level: scaleToContrastFilter(contrast) ?? "balanced",
    latitude_level: scaleToLatitudeFilter(latitude) ?? null,
    saturation_filter: scaleToSaturationFilter(saturation) ?? null,
  } as FilmStock;
}

/** Returns parsed film stocks from data/film-stocks.json, or null if not present/invalid. Normalizes legacy shape. */
export function getFilmStocksFromFile(): FilmStock[] | null {
  const fullPath = getDataPath();
  if (!fullPath) return null;
  try {
    const fs = require("fs");
    if (!fs.existsSync(fullPath)) return null;
    const raw = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    return (data as Record<string, unknown>[]).map(normalizeFilmStockFromFile);
  } catch {
    return null;
  }
}

/** Writes film stocks to data/film-stocks.json. Creates data/ if needed. */
export function writeFilmStocksToFile(stocks: FilmStock[]): void {
  const fullPath = getDataPath();
  if (!fullPath) throw new Error("Cannot resolve data path");
  const fs = require("fs");
  const path = require("path");
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(stocks, null, 2), "utf-8");
}

/** Returns true if the app is currently using the editable JSON file. */
export function isUsingEditableFile(): boolean {
  return getFilmStocksFromFile() !== null;
}

/** Removes data/film-stocks.json so the app falls back to seed. */
export function removeFilmStocksFile(): void {
  const fullPath = getDataPath();
  if (!fullPath) return;
  try {
    const fs = require("fs");
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // ignore
  }
}
