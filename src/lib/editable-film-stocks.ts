/**
 * Editable film stocks: when data/film-stocks.json exists, the app uses it instead of seed-data.
 * Use the admin UI at /admin/films to edit; "Save" writes here. Delete this file to revert to seed.
 */

import type { FilmStock } from "@/lib/types";

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

/** Returns parsed film stocks from data/film-stocks.json, or null if not present/invalid. */
export function getFilmStocksFromFile(): FilmStock[] | null {
  const fullPath = getDataPath();
  if (!fullPath) return null;
  try {
    const fs = require("fs");
    if (!fs.existsSync(fullPath)) return null;
    const raw = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    return data as FilmStock[];
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
