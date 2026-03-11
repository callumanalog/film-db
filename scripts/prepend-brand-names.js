/**
 * One-off: Prepend brand name to each film stock's name unless it already starts with that brand name.
 * Run from repo root: node scripts/prepend-brand-names.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STOCKS_PATH = path.join(ROOT, "data", "film-stocks.json");
const BRANDS_PATH = path.join(ROOT, "data", "brands.json");

const stocksRaw = fs.readFileSync(STOCKS_PATH, "utf-8");
const brandsRaw = fs.readFileSync(BRANDS_PATH, "utf-8");
const stocks = JSON.parse(stocksRaw);
const brands = JSON.parse(brandsRaw);

const brandNameById = new Map(brands.map((b) => [b.id, b.name]));

let updated = 0;
for (const stock of stocks) {
  const brandName = brandNameById.get(stock.brand_id);
  if (!brandName) continue;
  const trimmedBrand = brandName.trim();
  const nameTrimmed = (stock.name || "").trim();
  const alreadyHasBrand =
    nameTrimmed.toLowerCase().startsWith(trimmedBrand.toLowerCase()) ||
    nameTrimmed.toLowerCase().includes(trimmedBrand.toLowerCase());
  if (alreadyHasBrand) continue;
  stock.name = `${trimmedBrand} ${nameTrimmed}`;
  stock.updated_at = new Date().toISOString();
  updated++;
}

fs.writeFileSync(STOCKS_PATH, JSON.stringify(stocks, null, 2), "utf-8");
console.log(`Updated ${updated} film stock names. ${stocks.length - updated} already had brand in name.`);
