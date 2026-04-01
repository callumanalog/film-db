import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "playwright";
import { missingFilmStockImageSources } from "../data/missing-film-stock-image-sources";

const SOURCE_DIR = path.resolve(process.cwd(), "public/films-source");
const DIRECT_MANIFEST_PATH = path.resolve(process.cwd(), "public/films-source-manifest.json");
const FALLBACK_MANIFEST_PATH = path.resolve(process.cwd(), "public/films-source-browser-manifest.json");

interface DirectResult {
  slug: string;
  status: "downloaded" | "failed";
}

interface BrowserResult {
  slug: string;
  sourcePageUrl: string;
  status: "captured" | "failed";
  outputFile: string | null;
  note?: string;
  error?: string;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function captureProductImage(pageUrl: string, outputPath: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 1 });

  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    const handle = await page.evaluateHandle(() => {
      const images = Array.from(document.querySelectorAll("img"));
      const candidates = images
        .map((img) => {
          const rect = img.getBoundingClientRect();
          return {
            img,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            area: rect.width * rect.height,
            src: img.currentSrc || img.getAttribute("src") || "",
          };
        })
        .filter((item) => item.width >= 180 && item.height >= 180 && item.top > -200 && item.top < window.innerHeight * 1.5)
        .sort((a, b) => b.area - a.area);

      return candidates[0]?.img ?? null;
    });

    const element = handle.asElement();
    if (!element) {
      await page.screenshot({
        path: outputPath,
        type: "jpeg",
        quality: 90,
        clip: { x: 0, y: 0, width: 1600, height: 1200 },
      });
      return "Captured top viewport fallback because no isolated product image element was detected.";
    }

    await element.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await element.screenshot({ path: outputPath, type: "jpeg", quality: 92 });
    return "Captured primary image element via browser screenshot.";
  } finally {
    await page.close();
    await browser.close();
  }
}

async function main() {
  ensureDir(SOURCE_DIR);

  const directResults = fs.existsSync(DIRECT_MANIFEST_PATH)
    ? (JSON.parse(fs.readFileSync(DIRECT_MANIFEST_PATH, "utf8")) as DirectResult[])
    : [];
  const failedSlugs = new Set(directResults.filter((result) => result.status === "failed").map((result) => result.slug));
  const targets = missingFilmStockImageSources.filter((source) => failedSlugs.has(source.slug));

  const results: BrowserResult[] = [];

  for (const source of targets) {
    const outputFile = `${source.slug}.jpg`;
    const outputPath = path.join(SOURCE_DIR, outputFile);
    try {
      const note = await captureProductImage(source.sourcePageUrl, outputPath);
      results.push({
        slug: source.slug,
        sourcePageUrl: source.sourcePageUrl,
        status: "captured",
        outputFile,
        note,
      });
      console.log(`OK ${source.slug}`);
    } catch (error) {
      results.push({
        slug: source.slug,
        sourcePageUrl: source.sourcePageUrl,
        status: "failed",
        outputFile: null,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`FAILED ${source.slug}: ${results[results.length - 1].error}`);
    }
  }

  fs.writeFileSync(FALLBACK_MANIFEST_PATH, JSON.stringify(results, null, 2));
  const captured = results.filter((result) => result.status === "captured").length;
  const failed = results.length - captured;
  console.log(`\nSaved manifest: ${path.relative(process.cwd(), FALLBACK_MANIFEST_PATH)}`);
  console.log(`Captured: ${captured}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
