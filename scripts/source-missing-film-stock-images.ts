import * as fs from "node:fs";
import * as path from "node:path";
import sharp from "sharp";
import {
  missingFilmStockImageSources,
  type ImageSourceType,
} from "../data/missing-film-stock-image-sources";

type Confidence = "high" | "medium" | "low";

interface DownloadResult {
  slug: string;
  name: string;
  sourceType: ImageSourceType;
  sourcePageUrl: string;
  sourceImageUrl: string | null;
  confidence: Confidence;
  status: "downloaded" | "failed";
  note: string;
  outputFile: string | null;
  error?: string;
}

const OUTPUT_DIR = path.resolve(process.cwd(), "public/films-source");
const MANIFEST_PATH = path.resolve(process.cwd(), "public/films-source-manifest.json");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function getConfidence(sourceType: ImageSourceType): Confidence {
  if (sourceType === "official") return "high";
  if (sourceType === "retailer") return "medium";
  return "low";
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absoluteUrl(rawUrl: string, pageUrl: string): string {
  return new URL(decodeHtml(rawUrl), pageUrl).toString();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function collectCandidates(html: string, pageUrl: string): string[] {
  const candidates: string[] = [];
  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/gi,
  ];

  for (const pattern of metaPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      candidates.push(absoluteUrl(match[1], pageUrl));
    }
  }

  const ldJsonPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch: RegExpExecArray | null;
  while ((jsonMatch = ldJsonPattern.exec(html)) !== null) {
    const block = jsonMatch[1];
    const imageMatches = block.match(/"image"\s*:\s*(\[[^\]]+\]|"[^"]+")/g) ?? [];
    for (const imageMatch of imageMatches) {
      const urlMatches = imageMatch.match(/https?:\/\/[^"\\\s]+/g) ?? [];
      for (const url of urlMatches) {
        candidates.push(decodeHtml(url));
      }
    }
  }

  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    const src = imgMatch[1];
    if (!/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(src) && !/cdn|media|product|catalog|shopify|image/i.test(src)) {
      continue;
    }
    candidates.push(absoluteUrl(src, pageUrl));
  }

  return unique(
    candidates.filter((url) => {
      const lower = url.toLowerCase();
      return !lower.includes("logo") && !lower.includes("icon") && !lower.includes("avatar");
    })
  );
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.text();
}

async function fetchBuffer(
  url: string,
  pageUrl: string
): Promise<{ data: Buffer; contentType: string | null }> {
  const page = new URL(pageUrl);
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      referer: pageUrl,
      origin: page.origin,
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type"),
  };
}

async function downloadPrimaryImage(pageUrl: string): Promise<{ imageUrl: string; data: Buffer }> {
  const html = await fetchText(pageUrl);
  const candidates = collectCandidates(html, pageUrl);
  if (candidates.length === 0) {
    throw new Error("No candidate images found");
  }

  let lastError = "No downloadable candidates";
  for (const imageUrl of candidates) {
    try {
      const { data, contentType } = await fetchBuffer(imageUrl, pageUrl);
      if (contentType?.includes("svg")) {
        const rasterized = await sharp(data).png().toBuffer();
        return { imageUrl, data: rasterized };
      }
      return { imageUrl, data };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

async function saveAsJpeg(buffer: Buffer, outputPath: string): Promise<void> {
  await sharp(buffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(outputPath);
}

async function main() {
  ensureDir(OUTPUT_DIR);
  const results: DownloadResult[] = [];

  for (const source of missingFilmStockImageSources) {
    const outputFile = `${source.slug}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    try {
      const { imageUrl, data } = await downloadPrimaryImage(source.sourcePageUrl);
      await saveAsJpeg(data, outputPath);

      results.push({
        slug: source.slug,
        name: source.name,
        sourceType: source.sourceType,
        sourcePageUrl: source.sourcePageUrl,
        sourceImageUrl: imageUrl,
        confidence: getConfidence(source.sourceType),
        status: "downloaded",
        note: source.note,
        outputFile,
      });
      console.log(`OK ${source.slug}`);
    } catch (error) {
      results.push({
        slug: source.slug,
        name: source.name,
        sourceType: source.sourceType,
        sourcePageUrl: source.sourcePageUrl,
        sourceImageUrl: null,
        confidence: getConfidence(source.sourceType),
        status: "failed",
        note: source.note,
        outputFile: null,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`FAILED ${source.slug}: ${results[results.length - 1].error}`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(results, null, 2));

  const downloaded = results.filter((result) => result.status === "downloaded").length;
  const failed = results.length - downloaded;
  console.log(`\nSaved manifest: ${path.relative(process.cwd(), MANIFEST_PATH)}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
