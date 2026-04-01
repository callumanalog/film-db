import * as fs from "node:fs";
import * as path from "node:path";
import type { FilmBrand, FilmStock } from "../src/lib/types";
import { additionalFilmBrands, additionalFilmStocks } from "../src/lib/missing-film-stock-additions";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase/migrations");
const EXPERIMENTAL_SLUGS = new Set([
  "lomography-lomochrome-color-92",
  "lomography-lomochrome-color-92-sun-kissed",
  "lomography-lomochrome-turquoise",
  "lomography-redscale-xr",
]);

function sqlString(value: string | null | undefined) {
  if (value == null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlBool(value: boolean | null | undefined) {
  if (value == null) return "NULL";
  return value ? "TRUE" : "FALSE";
}

function sqlNumber(value: number | null | undefined) {
  return value == null ? "NULL" : String(value);
}

function sqlTextArray(values: string[]) {
  return `ARRAY[${values.map((value) => sqlString(value)).join(", ")}]::text[]`;
}

function sqlFormatArray(values: string[]) {
  return `ARRAY[${values.map((value) => sqlString(value)).join(", ")}]::film_format[]`;
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function groupStocks() {
  const color: FilmStock[] = [];
  const bw: FilmStock[] = [];
  const experimental: FilmStock[] = [];

  for (const stock of additionalFilmStocks) {
    if (EXPERIMENTAL_SLUGS.has(stock.slug)) {
      experimental.push(stock);
    } else if (stock.type === "bw_negative" || stock.type === "bw_reversal") {
      bw.push(stock);
    } else {
      color.push(stock);
    }
  }

  return { color, bw, experimental };
}

function brandsForBatch(stocks: FilmStock[]): FilmBrand[] {
  const brandIds = new Set(stocks.map((stock) => stock.brand_id));
  return additionalFilmBrands.filter((brand) => brandIds.has(brand.id));
}

function buildBrandUpsert(brand: FilmBrand) {
  return `INSERT INTO film_brands (name, slug, description, website_url, featured)
VALUES (
  ${sqlString(brand.name)},
  ${sqlString(brand.slug)},
  ${sqlString(brand.description)},
  ${sqlString(brand.website_url)},
  ${sqlBool(brand.featured ?? null)}
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  featured = EXCLUDED.featured,
  updated_at = now();`;
}

function buildStockUpsert(stock: FilmStock) {
  return `-- ${stock.slug}
INSERT INTO film_stocks (
  name,
  slug,
  brand_id,
  format,
  type,
  iso,
  description,
  history,
  shooting_notes,
  grain,
  contrast,
  latitude,
  saturation,
  color_balance,
  color_balance_type,
  color_balance_kelvin,
  dx_coding,
  development_process,
  best_for,
  discontinued,
  image_url,
  year_introduced,
  featured
)
VALUES (
  ${sqlString(stock.name)},
  ${sqlString(stock.slug)},
  (SELECT id FROM film_brands WHERE slug = ${sqlString(stock.brand_id.replace("brand-", ""))}),
  ${sqlFormatArray(stock.format)},
  ${sqlString(stock.type)}::film_type,
  ${sqlNumber(stock.iso)},
  ${sqlString(stock.description)},
  ${sqlString(stock.history)},
  ${sqlJson(stock.shooting_notes)},
  ${sqlNumber(stock.grain)},
  ${sqlNumber(stock.contrast)},
  ${sqlNumber(stock.latitude)},
  ${sqlNumber(stock.saturation)},
  ${sqlString(stock.color_balance)},
  ${sqlString(stock.color_balance_type ?? null)},
  ${sqlNumber(stock.color_balance_kelvin ?? null)},
  ${sqlBool(stock.dx_coding ?? null)},
  ${sqlString(stock.development_process ?? null)},
  ${sqlTextArray(stock.best_for)},
  ${sqlBool(stock.discontinued)},
  ${sqlString(stock.image_url)},
  ${sqlNumber(stock.year_introduced)},
  ${sqlBool(stock.featured)}
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  brand_id = EXCLUDED.brand_id,
  format = EXCLUDED.format,
  type = EXCLUDED.type,
  iso = EXCLUDED.iso,
  description = EXCLUDED.description,
  history = EXCLUDED.history,
  shooting_notes = EXCLUDED.shooting_notes,
  grain = EXCLUDED.grain,
  contrast = EXCLUDED.contrast,
  latitude = EXCLUDED.latitude,
  saturation = EXCLUDED.saturation,
  color_balance = EXCLUDED.color_balance,
  color_balance_type = EXCLUDED.color_balance_type,
  color_balance_kelvin = EXCLUDED.color_balance_kelvin,
  dx_coding = EXCLUDED.dx_coding,
  development_process = EXCLUDED.development_process,
  best_for = EXCLUDED.best_for,
  discontinued = EXCLUDED.discontinued,
  image_url = EXCLUDED.image_url,
  year_introduced = EXCLUDED.year_introduced,
  featured = EXCLUDED.featured,
  updated_at = now();`;
}

function buildMigration(
  filename: string,
  title: string,
  stocks: FilmStock[],
  noteHeaders: string[]
) {
  const brands = brandsForBatch(stocks);
  const chunks: string[] = [
    `-- ${title}`,
    `-- Scope: ${stocks.map((stock) => stock.slug).join(", ")}`,
    `-- Note schema: ${noteHeaders.join(", ")}`,
    "",
  ];

  if (brands.length > 0) {
    chunks.push("-- Ensure supporting brands exist.");
    chunks.push(...brands.map(buildBrandUpsert));
    chunks.push("");
  }

  chunks.push(...stocks.map(buildStockUpsert));
  fs.writeFileSync(path.join(MIGRATIONS_DIR, filename), `${chunks.join("\n\n")}\n`, "utf8");
}

function main() {
  const { color, bw, experimental } = groupStocks();

  buildMigration(
    "053_missing_color_stocks_metadata_and_performance.sql",
    "Insert/update missing conventional color stocks with metadata, specs, and shooting notes.",
    color,
    ["Skin Tones", "Color Bias", "Push/Pull", "Shadow Detail", "Highlight Roll-off"]
  );

  buildMigration(
    "054_missing_bw_stocks_metadata_and_performance.sql",
    "Insert/update missing black-and-white stocks with metadata, scales, and shooting notes.",
    bw,
    ["Tonal Range", "Push/Pull", "Shadow Detail", "Highlight Roll-off"]
  );

  buildMigration(
    "055_missing_experimental_stocks_metadata_and_performance.sql",
    "Insert/update missing experimental stocks with metadata, scales, and effect-oriented shooting notes.",
    experimental,
    ["Effect Character", "Effect Intensity", "Scene Pairing", "Exposure Flexibility", "Highlight Behavior"]
  );

  console.log("Generated migrations 053-055 from missing film stock additions.");
}

main();
