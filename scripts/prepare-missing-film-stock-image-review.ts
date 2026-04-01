import * as fs from "node:fs";
import * as path from "node:path";
import { missingFilmStockImageSources } from "../data/missing-film-stock-image-sources";

type Confidence = "high" | "medium" | "low";

interface DirectManifestEntry {
  slug: string;
  name: string;
  sourceType: "official" | "retailer" | "secondary";
  sourcePageUrl: string;
  sourceImageUrl: string | null;
  confidence: Confidence;
  status: "downloaded" | "failed";
  note: string;
  outputFile: string | null;
  error?: string;
}

interface BrowserManifestEntry {
  slug: string;
  sourcePageUrl: string;
  status: "captured" | "failed";
  outputFile: string | null;
  note?: string;
  error?: string;
}

interface ReviewManifestEntry {
  slug: string;
  name: string;
  sourceType: "official" | "retailer" | "secondary";
  confidence: Confidence;
  captureMethod: "direct" | "browser-fallback";
  sourcePageUrl: string;
  sourceImageUrl: string | null;
  reviewFile: string;
  note: string;
}

const ROOT = process.cwd();
const SOURCE_DIR = path.resolve(ROOT, "public/films-source");
const REVIEW_SOURCE_DIR = path.resolve(ROOT, "public/films-missing-review-source");
const DIRECT_MANIFEST = path.resolve(ROOT, "public/films-source-manifest.json");
const BROWSER_MANIFEST = path.resolve(ROOT, "public/films-source-browser-manifest.json");
const REVIEW_MANIFEST_JSON = path.resolve(ROOT, "public/films-missing-review-manifest.json");
const REVIEW_MANIFEST_MD = path.resolve(ROOT, "docs/missing-film-stock-image-review.md");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function copyFile(sourcePath: string, targetPath: string) {
  fs.copyFileSync(sourcePath, targetPath);
}

function main() {
  ensureDir(REVIEW_SOURCE_DIR);
  const validReviewFiles = new Set(missingFilmStockImageSources.map((source) => `${source.slug}.jpg`));
  for (const file of fs.readdirSync(REVIEW_SOURCE_DIR)) {
    const filePath = path.join(REVIEW_SOURCE_DIR, file);
    if (!fs.statSync(filePath).isFile()) continue;
    if (!validReviewFiles.has(file)) {
      fs.unlinkSync(filePath);
    }
  }

  const direct = new Map(
    readJson<DirectManifestEntry[]>(DIRECT_MANIFEST).map((entry) => [entry.slug, entry])
  );
  const browser = new Map(
    readJson<BrowserManifestEntry[]>(BROWSER_MANIFEST).map((entry) => [entry.slug, entry])
  );

  const reviewEntries: ReviewManifestEntry[] = [];

  for (const source of missingFilmStockImageSources) {
    const directEntry = direct.get(source.slug);
    const browserEntry = browser.get(source.slug);

    let captureMethod: "direct" | "browser-fallback";
    let note = source.note;
    let sourceImageUrl: string | null = null;
    let sourcePath: string | null = null;

    if (directEntry?.status === "downloaded" && directEntry.outputFile) {
      captureMethod = "direct";
      sourceImageUrl = directEntry.sourceImageUrl;
      sourcePath = path.join(SOURCE_DIR, directEntry.outputFile);
      note = directEntry.note;
    } else if (browserEntry?.status === "captured" && browserEntry.outputFile) {
      captureMethod = "browser-fallback";
      sourcePath = path.join(SOURCE_DIR, browserEntry.outputFile);
      note = `${source.note} ${browserEntry.note ?? ""}`.trim();
    } else {
      throw new Error(`Missing captured source image for ${source.slug}`);
    }

    const reviewFile = `${source.slug}.jpg`;
    copyFile(sourcePath, path.join(REVIEW_SOURCE_DIR, reviewFile));

    reviewEntries.push({
      slug: source.slug,
      name: source.name,
      sourceType: source.sourceType,
      confidence: source.sourceType === "official" ? "high" : source.sourceType === "retailer" ? "medium" : "low",
      captureMethod,
      sourcePageUrl: source.sourcePageUrl,
      sourceImageUrl,
      reviewFile,
      note,
    });
  }

  fs.writeFileSync(REVIEW_MANIFEST_JSON, JSON.stringify(reviewEntries, null, 2));

  const lines = [
    "# Missing Film Stock Image Review",
    "",
    `Prepared ${reviewEntries.length} missing-stock source images for review.`,
    "",
    "## Confidence Key",
    "",
    "- `high`: official source page",
    "- `medium`: retailer product page",
    "- `low`: secondary/archival source or browser-captured fallback",
    "",
    "## Sources",
    "",
    "| Slug | Name | Source type | Capture method | Confidence | Source page | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...reviewEntries.map(
      (entry) =>
        `| ${entry.slug} | ${entry.name} | ${entry.sourceType} | ${entry.captureMethod} | ${entry.confidence} | ${entry.sourcePageUrl} | ${entry.note.replace(/\|/g, "/")} |`
    ),
    "",
  ];

  fs.writeFileSync(REVIEW_MANIFEST_MD, `${lines.join("\n")}\n`);

  console.log(`Prepared review source folder: ${path.relative(ROOT, REVIEW_SOURCE_DIR)}`);
  console.log(`Wrote JSON manifest: ${path.relative(ROOT, REVIEW_MANIFEST_JSON)}`);
  console.log(`Wrote Markdown manifest: ${path.relative(ROOT, REVIEW_MANIFEST_MD)}`);
}

main();
