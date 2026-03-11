/**
 * One-off: Add color_balance to all color film stocks (skip B&W and B&W reversal).
 * Format: "Daylight-balanced (≈5500K)" or "Tungsten-balanced (≈3200K)" for 800T.
 * Run from repo root: node scripts/add-color-balance.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STOCKS_PATH = path.join(ROOT, "data", "film-stocks.json");

const COLOR_TYPES = ["color_negative", "color_reversal", "instant"];
const TUNGSTEN_SLUG = "cinestill-800t";

const stocks = JSON.parse(fs.readFileSync(STOCKS_PATH, "utf-8"));
let added = 0;
let skipped = 0;

for (const stock of stocks) {
  if (!COLOR_TYPES.includes(stock.type)) continue;
  const existing = (stock.color_balance || "").trim();
  if (existing) {
    skipped++;
    continue;
  }
  stock.color_balance =
    stock.slug === TUNGSTEN_SLUG
      ? "Tungsten-balanced (≈3200K)"
      : "Daylight-balanced (≈5500K)";
  stock.updated_at = new Date().toISOString();
  added++;
}

fs.writeFileSync(STOCKS_PATH, JSON.stringify(stocks, null, 2), "utf-8");
console.log(`Added color_balance to ${added} color film stocks. Skipped ${skipped} (already set).`);
