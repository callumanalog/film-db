import * as fs from "node:fs";
import * as path from "node:path";
import { additionalFilmStocks } from "../src/lib/missing-film-stock-additions";

const targetPath = path.resolve(process.cwd(), "data/film-stocks.json");

function main() {
  const raw = fs.readFileSync(targetPath, "utf8");
  const existing = JSON.parse(raw) as Array<Record<string, unknown>>;
  const seen = new Set(existing.map((item) => String(item.slug)));
  const merged = [...existing];

  for (const stock of additionalFilmStocks) {
    if (seen.has(stock.slug)) continue;
    merged.push(stock);
  }

  fs.writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Synced ${additionalFilmStocks.length} missing stock additions into ${path.relative(process.cwd(), targetPath)}`);
}

main();
