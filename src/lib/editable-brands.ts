/**
 * Editable brands: when data/brands.json exists, the app uses it instead of seed-data.
 */

import type { FilmBrand } from "@/lib/types";

const BRANDS_PATH = "data/brands.json";

function getDataPath(): string | null {
  if (typeof process === "undefined" || !process.cwd) return null;
  try {
    const path = require("path");
    return path.join(process.cwd(), BRANDS_PATH);
  } catch {
    return null;
  }
}

export function getBrandsFromFile(): FilmBrand[] | null {
  const fullPath = getDataPath();
  if (!fullPath) return null;
  try {
    const fs = require("fs");
    if (!fs.existsSync(fullPath)) return null;
    const raw = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    return data as FilmBrand[];
  } catch {
    return null;
  }
}

export function writeBrandsToFile(brands: FilmBrand[]): void {
  const fullPath = getDataPath();
  if (!fullPath) throw new Error("Cannot resolve data path");
  const fs = require("fs");
  const path = require("path");
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(brands, null, 2), "utf-8");
}

export function removeBrandsFile(): void {
  const fullPath = getDataPath();
  if (!fullPath) return;
  try {
    const fs = require("fs");
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // ignore
  }
}
