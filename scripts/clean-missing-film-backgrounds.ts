import * as path from "node:path";
import sharp from "sharp";

const TARGET_SLUGS = [
  "adox-scala-50",
  "agfa-apx-25",
  "agfa-vista-plus-100",
  "ferrania-solaris-fg-plus-100",
  "ferrania-solaris-fg-plus-200",
  "ferrania-solaris-fg-plus-400",
  "fujifilm-reala-ace-100",
  "fujifilm-superia-800",
  "fujifilm-superia-reala-100",
  "fujifilm-velvia-100f",
  "kodak-kodachrome-25",
  "kodak-kodachrome-64",
  "kodak-plus-x-pan-125",
  "lomography-lomochrome-color-92",
  "orwo-wolfen-nc400",
] as const;

const SOURCE_DIR = path.resolve(process.cwd(), "public/films-missing-review-source");

function isBackgroundLike(r: number, g: number, b: number, a: number): boolean {
  if (a < 245) return true;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (luminance >= 238) return true;
  if (luminance >= 210 && chroma <= 80) return true;
  if (luminance >= 185 && chroma <= 48) return true;
  if (luminance >= 160 && chroma <= 24) return true;

  return false;
}

async function whitenEdgeConnectedBackground(imagePath: string) {
  const image = sharp(imagePath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  function enqueue(x: number, y: number) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queue.push(idx);
  }

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const pixelOffset = idx * 4;
    const r = data[pixelOffset];
    const g = data[pixelOffset + 1];
    const b = data[pixelOffset + 2];
    const a = data[pixelOffset + 3];

    if (!isBackgroundLike(r, g, b, a)) continue;

    data[pixelOffset] = 255;
    data[pixelOffset + 1] = 255;
    data[pixelOffset + 2] = 255;
    data[pixelOffset + 3] = 255;

    const x = idx % width;
    const y = Math.floor(idx / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(imagePath);
}

async function main() {
  for (const slug of TARGET_SLUGS) {
    const imagePath = path.join(SOURCE_DIR, `${slug}.jpg`);
    await whitenEdgeConnectedBackground(imagePath);
    console.log(`OK ${slug}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
