import * as fs from "node:fs";
import * as path from "node:path";
import sharp from "sharp";
import { missingFilmStockImageSources } from "../data/missing-film-stock-image-sources";

const UPDATE_DIR = "/Users/ckilby/Documents/Films-missing-update";
const REVIEW_SOURCE_DIR = path.resolve(process.cwd(), "public/films-missing-review-source");

const EXTENSION_PRIORITY = [".tiff", ".tif", ".png", ".webp", ".jpeg", ".jpg"];

function normalizeBaseName(filename: string): string {
  return path.basename(filename, path.extname(filename)).toLowerCase();
}

function choosePreferred(files: string[]): string {
  return [...files].sort((a, b) => {
    const extA = path.extname(a).toLowerCase();
    const extB = path.extname(b).toLowerCase();
    return EXTENSION_PRIORITY.indexOf(extA) - EXTENSION_PRIORITY.indexOf(extB);
  })[0];
}

async function writeReviewSource(inputPath: string, outputPath: string) {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") {
    fs.copyFileSync(inputPath, outputPath);
    return;
  }

  await sharp(inputPath)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(outputPath);
}

async function main() {
  if (!fs.existsSync(UPDATE_DIR) || !fs.statSync(UPDATE_DIR).isDirectory()) {
    throw new Error(`Update folder not found: ${UPDATE_DIR}`);
  }

  const allowedSlugs = new Set(missingFilmStockImageSources.map((entry) => entry.slug));
  const candidates = fs
    .readdirSync(UPDATE_DIR)
    .filter((file) => fs.statSync(path.join(UPDATE_DIR, file)).isFile());

  const filesBySlug = new Map<string, string[]>();
  for (const file of candidates) {
    const slug = normalizeBaseName(file);
    if (!allowedSlugs.has(slug)) continue;
    const existing = filesBySlug.get(slug) ?? [];
    existing.push(file);
    filesBySlug.set(slug, existing);
  }

  let updated = 0;
  for (const [slug, files] of [...filesBySlug.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const chosen = choosePreferred(files);
    const inputPath = path.join(UPDATE_DIR, chosen);
    const outputPath = path.join(REVIEW_SOURCE_DIR, `${slug}.jpg`);
    await writeReviewSource(inputPath, outputPath);
    updated++;
    console.log(`OK ${slug} <= ${chosen}`);
  }

  console.log(`\nApplied ${updated} updated original(s) to ${path.relative(process.cwd(), REVIEW_SOURCE_DIR)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
