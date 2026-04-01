import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  supplementalNotableFilmStocks,
  type ReferenceFilmFamily,
  type ReferenceFilmStatus,
  type ReferenceFilmType,
} from "../data/notable-film-stock-supplements";

interface CurrentFilmStock {
  name: string;
  slug: string;
  brand_id: string;
  iso?: number | null;
  type?: string | null;
}

interface ReferenceFilmStock {
  slug: string;
  brand: string;
  name: string;
  iso: number | null;
  type: ReferenceFilmType;
  family: ReferenceFilmFamily;
  status: ReferenceFilmStatus;
  sourceNote: string;
  aliases: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const currentCatalogPath = path.join(rootDir, "data", "film-stocks.json");
const reportPath = path.join(rootDir, "docs", "missing-film-stocks.md");

const brandLabelById: Record<string, string> = {
  "brand-adox": "ADOX",
  "brand-agfa": "Agfa",
  "brand-bergger": "Bergger",
  "brand-cinestill": "CineStill",
  "brand-dubblefilm": "Dubblefilm",
  "brand-ferrania": "Film Ferrania",
  "brand-foma": "Foma",
  "brand-fujifilm": "Fujifilm",
  "brand-harman": "Harman",
  "brand-ilford": "Ilford",
  "brand-jch": "JCH",
  "brand-kentmere": "Kentmere",
  "brand-kodak": "Kodak",
  "brand-kosmo-foto": "Kosmo Foto",
  "brand-lomography": "Lomography",
  "brand-orwo": "ORWO",
  "brand-revolog": "Revolog",
  "brand-rollei": "Rollei",
  "brand-silberra": "Silberra",
  "brand-street-candy": "Street Candy",
  "brand-washi": "Film Washi",
};

const typeLabelByKey: Record<ReferenceFilmType, string> = {
  color_negative: "Color negative",
  bw_negative: "Black and white negative",
  color_reversal: "Color reversal",
  bw_reversal: "Black and white reversal",
  experimental: "Experimental / special effect",
};

const familyLabelByKey: Record<ReferenceFilmFamily, string> = {
  standard: "Standard still films",
  cine_derived: "Cine-derived still films",
  sheet_film: "Sheet-film-first stocks",
};

function normalizeToken(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['".,/()+-]/g, " ")
    .replace(/\b(?:film|photo|plus)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildNameKey(brand: string, name: string, iso: number | null | undefined): string {
  const brandKey = normalizeToken(brand);
  const nameKey = normalizeToken(name);
  const isoKey = iso == null ? "na" : String(iso);
  return `${brandKey}|${nameKey}|${isoKey}`;
}

function buildCurrentReference(stock: CurrentFilmStock): ReferenceFilmStock {
  const brand = brandLabelById[stock.brand_id] ?? stock.brand_id.replace(/^brand-/, "");
  const currentType = stock.type ?? "bw_negative";
  const type: ReferenceFilmType =
    currentType === "color_negative" ||
    currentType === "bw_negative" ||
    currentType === "color_reversal" ||
    currentType === "bw_reversal"
      ? currentType
      : "experimental";

  return {
    slug: stock.slug,
    brand,
    name: stock.name,
    iso: stock.iso ?? null,
    type,
    family: "standard",
    status: "current",
    sourceNote: "Already present in the current local catalog.",
    aliases: [],
  };
}

function getReferenceKeys(stock: ReferenceFilmStock): Set<string> {
  const keys = new Set<string>([stock.slug.toLowerCase(), buildNameKey(stock.brand, stock.name, stock.iso)]);
  for (const alias of stock.aliases) {
    keys.add(buildNameKey(stock.brand, alias, stock.iso));
  }
  return keys;
}

function groupBy<T, K extends string>(items: T[], getKey: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

function sortStocks(stocks: ReferenceFilmStock[]): ReferenceFilmStock[] {
  return [...stocks].sort(
    (a, b) =>
      a.brand.localeCompare(b.brand) ||
      a.name.localeCompare(b.name) ||
      (a.iso ?? 0) - (b.iso ?? 0)
  );
}

function renderSection(title: string, stocks: ReferenceFilmStock[]): string {
  if (stocks.length === 0) {
    return `### ${title}\n\n- None.\n`;
  }

  const byFamily = groupBy(sortStocks(stocks), (stock) => stock.family);
  const chunks: string[] = [`### ${title}\n`];

  for (const family of ["standard", "cine_derived", "sheet_film"] as const) {
    const familyStocks = byFamily[family];
    if (!familyStocks || familyStocks.length === 0) continue;

    chunks.push(`#### ${familyLabelByKey[family]}\n`);

    const byType = groupBy(familyStocks, (stock) => stock.type);
    for (const type of [
      "color_negative",
      "bw_negative",
      "color_reversal",
      "bw_reversal",
      "experimental",
    ] as const) {
      const typeStocks = byType[type];
      if (!typeStocks || typeStocks.length === 0) continue;

      chunks.push(`- ${typeLabelByKey[type]} (${typeStocks.length})`);
      for (const stock of typeStocks) {
        chunks.push(
          `  - ${stock.brand} - ${stock.name}${stock.iso != null ? ` (${stock.iso})` : ""}. ${stock.sourceNote}`
        );
      }
      chunks.push("");
    }
  }

  return `${chunks.join("\n").trim()}\n`;
}

function main() {
  const currentCatalog = JSON.parse(readFileSync(currentCatalogPath, "utf8")) as CurrentFilmStock[];
  const currentReferences = currentCatalog.map(buildCurrentReference);
  const supplementalReferences: ReferenceFilmStock[] = supplementalNotableFilmStocks.map((stock) => ({
    ...stock,
    aliases: stock.aliases ?? [],
  }));
  const masterCatalog = [...currentReferences, ...supplementalReferences];

  const currentKeys = new Set<string>();
  for (const stock of currentReferences) {
    for (const key of getReferenceKeys(stock)) {
      currentKeys.add(key);
    }
  }

  const missing = supplementalReferences.filter((stock) => {
    for (const key of getReferenceKeys(stock)) {
      if (currentKeys.has(key)) return false;
    }
    return true;
  });

  const currentMissing = sortStocks(missing.filter((stock) => stock.status === "current"));
  const discontinuedMissing = sortStocks(missing.filter((stock) => stock.status === "discontinued"));

  const lines = [
    "# Missing Film Stocks",
    "",
    `Generated on ${new Date().toISOString().slice(0, 10)} from \`data/film-stocks.json\` plus the curated supplemental reference set in \`data/notable-film-stock-supplements.ts\`.`,
    "",
    "## Summary",
    "",
    `- Current catalog entries: ${currentReferences.length}`,
    `- Supplemental notable entries checked: ${supplementalReferences.length}`,
    `- Combined master reference size: ${masterCatalog.length}`,
    `- Missing current-production stocks: ${currentMissing.length}`,
    `- Missing discontinued notable stocks: ${discontinuedMissing.length}`,
    `- Total missing stocks in this reference model: ${missing.length}`,
    "",
    "## Matching Rules",
    "",
    "- Compare by slug first, then by normalized brand + name + ISO.",
    "- Normalization ignores punctuation and collapses spacing.",
    "- Brand-level aliases handle small naming differences such as `Astia 100F` vs `Fujichrome Astia 100F`.",
    "- This report treats film stocks as emulsions or marketed products, not separate entries per format.",
    "",
    "## Missing Current-Production Stocks",
    "",
    renderSection("Current Production", currentMissing).trimEnd(),
    "",
    "## Missing Discontinued Notable Stocks",
    "",
    renderSection("Discontinued", discontinuedMissing).trimEnd(),
    "",
    "## Scope Notes",
    "",
    "- This is a curated notable-film reference, not an attempt to enumerate every private-label respool or short-lived regional rebrand.",
    "- Cine-derived entries are included when they are widely sold to still photographers as named stocks or are major motion-picture emulsions commonly respoolled for still use.",
    "- Sheet-film-only entries are included when the emulsion is meaningfully distinct from your current catalog.",
  ];

  const report = `${lines.join("\n")}\n`;
  writeFileSync(reportPath, report, "utf8");

  console.log(`Wrote ${reportPath}`);
  console.log(`Current-production missing: ${currentMissing.length}`);
  console.log(`Discontinued missing: ${discontinuedMissing.length}`);
  console.log(`Total missing: ${missing.length}`);
}

main();
