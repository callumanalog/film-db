import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const DEFAULT_SOURCE_DIR = "public/films-source";
const DEFAULT_OUTPUT_DIR = "public/films-normalized";
const DEFAULT_DEBUG_DIR = "public/films-debug";
const DEFAULT_OVERRIDES_PATH = "public/films-overrides.json";

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1200;
const TARGET_OCCUPANCY = 0.72;
const BACKGROUND_THRESHOLD = 242;
const MIN_COMPONENT_AREA_RATIO = 0.0035;
const CROP_PADDING_RATIO = 0.03;
const ANALYSIS_MAX_DIM = 256;

interface CropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface FilmImageOverride {
  crop?: CropBox;
  occupancy?: number;
  backgroundThreshold?: number;
  componentIndex?: number;
  preferRightmost?: boolean;
}

type FilmImageOverrides = Record<string, FilmImageOverride>;

interface Component {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
}

interface DetectionResult {
  crop: CropBox;
  componentCount: number;
  componentIndex: number;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function listImageFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((file) => EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function loadOverrides(filePath: string): FilmImageOverrides {
  if (!fs.existsSync(filePath)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as FilmImageOverrides;
    return data ?? {};
  } catch (error) {
    throw new Error(`Failed to read overrides from ${filePath}: ${String(error)}`);
  }
}

function isForeground(r: number, g: number, b: number, threshold: number): boolean {
  return r < threshold || g < threshold || b < threshold;
}

function pushComponent(
  startX: number,
  startY: number,
  width: number,
  height: number,
  mask: Uint8Array,
  visited: Uint8Array
): Component {
  const stack = [startY * width + startX];
  visited[startY * width + startX] = 1;

  let minX = startX;
  let minY = startY;
  let maxX = startX;
  let maxY = startY;
  let area = 0;

  while (stack.length > 0) {
    const index = stack.pop()!;
    const x = index % width;
    const y = Math.floor(index / width);
    area++;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nextIndex = ny * width + nx;
      if (visited[nextIndex] || mask[nextIndex] === 0) continue;
      visited[nextIndex] = 1;
      stack.push(nextIndex);
    }
  }

  return { minX, minY, maxX, maxY, area };
}

function chooseComponent(
  components: Component[],
  analysisWidth: number,
  analysisHeight: number,
  override?: FilmImageOverride
): { component: Component; index: number } {
  const sorted = [...components].sort((a, b) => {
    const scoreA = scoreComponent(a, analysisWidth, analysisHeight, override?.preferRightmost ?? true);
    const scoreB = scoreComponent(b, analysisWidth, analysisHeight, override?.preferRightmost ?? true);
    return scoreB - scoreA;
  });

  const requestedIndex = override?.componentIndex ?? 0;
  const component = sorted[Math.min(requestedIndex, sorted.length - 1)];
  return { component, index: requestedIndex };
}

function scoreComponent(
  component: Component,
  analysisWidth: number,
  analysisHeight: number,
  preferRightmost: boolean
): number {
  const bboxWidth = component.maxX - component.minX + 1;
  const bboxHeight = component.maxY - component.minY + 1;
  const bboxArea = bboxWidth * bboxHeight;
  const imageArea = analysisWidth * analysisHeight;
  const areaNorm = component.area / imageArea;
  const bboxNorm = bboxArea / imageArea;
  const centerX = (component.minX + component.maxX) / 2 / analysisWidth;
  const aspect = bboxWidth / Math.max(1, bboxHeight);
  const aspectScore = 1 - Math.min(Math.abs(aspect - 1.1), 1.1) / 1.1;
  const widthScore = bboxWidth / analysisWidth;
  const rightBias = preferRightmost ? centerX : 0.5;
  return bboxNorm * 0.45 + areaNorm * 0.2 + aspectScore * 0.2 + widthScore * 0.1 + rightBias * 0.05;
}

async function detectBoxCrop(
  imagePath: string,
  override?: FilmImageOverride
): Promise<DetectionResult> {
  if (override?.crop) {
    return { crop: override.crop, componentCount: 0, componentIndex: -1 };
  }

  const base = sharp(imagePath).rotate();
  const metadata = await base.metadata();
  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  if (!originalWidth || !originalHeight) {
    throw new Error(`Could not read image metadata for ${imagePath}`);
  }

  const scale = Math.min(1, ANALYSIS_MAX_DIM / Math.max(originalWidth, originalHeight));
  const analysisWidth = Math.max(1, Math.round(originalWidth * scale));
  const analysisHeight = Math.max(1, Math.round(originalHeight * scale));

  const { data } = await base
    .resize(analysisWidth, analysisHeight, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = override?.backgroundThreshold ?? BACKGROUND_THRESHOLD;
  const mask = new Uint8Array(analysisWidth * analysisHeight);
  const visited = new Uint8Array(analysisWidth * analysisHeight);

  for (let y = 0; y < analysisHeight; y++) {
    for (let x = 0; x < analysisWidth; x++) {
      const idx = (y * analysisWidth + x) * 3;
      if (isForeground(data[idx], data[idx + 1], data[idx + 2], threshold)) {
        mask[y * analysisWidth + x] = 1;
      }
    }
  }

  const minArea = Math.max(20, Math.round(analysisWidth * analysisHeight * MIN_COMPONENT_AREA_RATIO));
  const components: Component[] = [];

  for (let y = 0; y < analysisHeight; y++) {
    for (let x = 0; x < analysisWidth; x++) {
      const index = y * analysisWidth + x;
      if (mask[index] === 0 || visited[index] === 1) continue;
      const component = pushComponent(x, y, analysisWidth, analysisHeight, mask, visited);
      if (component.area >= minArea) {
        components.push(component);
      }
    }
  }

  if (components.length === 0) {
    return {
      crop: { left: 0, top: 0, width: originalWidth, height: originalHeight },
      componentCount: 0,
      componentIndex: -1,
    };
  }

  const { component, index } = chooseComponent(components, analysisWidth, analysisHeight, override);

  const padX = Math.round((component.maxX - component.minX + 1) * CROP_PADDING_RATIO);
  const padY = Math.round((component.maxY - component.minY + 1) * CROP_PADDING_RATIO);

  const left = Math.max(0, Math.floor((component.minX - padX) / scale));
  const top = Math.max(0, Math.floor((component.minY - padY) / scale));
  const right = Math.min(originalWidth, Math.ceil((component.maxX + padX + 1) / scale));
  const bottom = Math.min(originalHeight, Math.ceil((component.maxY + padY + 1) / scale));

  return {
    crop: {
      left,
      top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top),
    },
    componentCount: components.length,
    componentIndex: index,
  };
}

async function normalizeImage(
  sourcePath: string,
  outputPath: string,
  debugPath: string,
  override?: FilmImageOverride
): Promise<DetectionResult> {
  const base = sharp(sourcePath).rotate();
  const detection = await detectBoxCrop(sourcePath, override);
  const occupancy = override?.occupancy ?? TARGET_OCCUPANCY;

  const cropped = base.extract(detection.crop);
  const metadata = await cropped.metadata();
  const cropWidth = metadata.width ?? detection.crop.width;
  const cropHeight = metadata.height ?? detection.crop.height;
  const scale = Math.min((CANVAS_WIDTH * occupancy) / cropWidth, (CANVAS_HEIGHT * occupancy) / cropHeight);
  const resizedWidth = Math.max(1, Math.round(cropWidth * scale));
  const resizedHeight = Math.max(1, Math.round(cropHeight * scale));
  const left = Math.round((CANVAS_WIDTH - resizedWidth) / 2);
  const top = Math.round((CANVAS_HEIGHT - resizedHeight) / 2);

  const normalized = await cropped
    .resize(resizedWidth, resizedHeight, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: normalized, left, top }])
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(outputPath);

  const debugSvg = `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${left}" y="${top}" width="${resizedWidth}" height="${resizedHeight}" fill="none" stroke="#ff3b30" stroke-width="6"/>
      <rect x="3" y="3" width="${CANVAS_WIDTH - 6}" height="${CANVAS_HEIGHT - 6}" fill="none" stroke="#cccccc" stroke-width="6"/>
    </svg>
  `;

  await sharp(outputPath)
    .composite([{ input: Buffer.from(debugSvg), top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toFile(debugPath);

  return detection;
}

async function main() {
  const sourceDir = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_SOURCE_DIR);
  const outputDir = path.resolve(process.cwd(), process.argv[3] ?? DEFAULT_OUTPUT_DIR);
  const debugDir = path.resolve(process.cwd(), process.argv[4] ?? DEFAULT_DEBUG_DIR);
  const overridesPath = path.resolve(process.cwd(), process.argv[5] ?? DEFAULT_OVERRIDES_PATH);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    console.error("Source folder not found:", sourceDir);
    console.error("Add raw product images named by slug before running normalization.");
    process.exit(1);
  }

  ensureDir(outputDir);
  ensureDir(debugDir);

  const overrides = loadOverrides(overridesPath);
  const files = listImageFiles(sourceDir);

  if (files.length === 0) {
    console.error("No image files found in", sourceDir);
    process.exit(1);
  }

  console.log(`Normalizing ${files.length} film stock image(s)\n`);

  let processed = 0;
  const failures: string[] = [];

  for (const filename of files) {
    const slug = path.basename(filename, path.extname(filename));
    const sourcePath = path.join(sourceDir, filename);
    const outputPath = path.join(outputDir, `${slug}.jpg`);
    const debugPath = path.join(debugDir, `${slug}.jpg`);

    try {
      const detection = await normalizeImage(sourcePath, outputPath, debugPath, overrides[slug]);
      processed++;
      const label =
        detection.componentIndex === -1
          ? "manual/full-image fallback"
          : `component ${detection.componentIndex + 1} of ${detection.componentCount}`;
      console.log(`  OK ${slug} (${label})`);
    } catch (error) {
      failures.push(slug);
      console.error(`  Failed ${slug}: ${String(error)}`);
    }
  }

  console.log(`\nDone. Normalized: ${processed}/${files.length}`);
  console.log(`Output: ${path.relative(process.cwd(), outputDir)}`);
  console.log(`Debug:  ${path.relative(process.cwd(), debugDir)}`);
  console.log(`Overrides: ${path.relative(process.cwd(), overridesPath)}`);

  if (failures.length > 0) {
    console.error("\nFailed slugs:");
    for (const slug of failures) {
      console.error(`- ${slug}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
