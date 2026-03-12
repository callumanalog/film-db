/**
 * Upload film stock images from a local folder to Supabase Storage (film-stocks bucket)
 * and update film_stocks.image_url for each matching slug.
 *
 * Prerequisites:
 * 1. Run migration 008 (film-stocks bucket): supabase db push or run 008_film_stocks_storage_bucket.sql in SQL Editor.
 * 2. Put image files in a folder; each filename (without extension) must match a film_stocks.slug (e.g. portra-400.jpg → slug "portra-400").
 *
 * Usage:
 *   npx tsx scripts/upload-film-stock-images.ts [folder]
 *   (default folder: public/films)
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=
 *   SUPABASE_SERVICE_ROLE_KEY=
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

const BUCKET = "film-stocks";
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getPublicUrl(filename: string): string {
  if (!url) return "";
  const base = url.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function main() {
  const folder = process.argv[2] ?? "public/films";
  const dir = path.resolve(process.cwd(), folder);

  if (!url || !serviceRoleKey) {
    console.error("Missing env. In .env.local set:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
    process.exit(1);
  }

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error("Folder not found:", dir);
    console.error("Create it and add image files named by slug (e.g. portra-400.jpg).");
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return EXTENSIONS.includes(ext);
  });

  if (files.length === 0) {
    console.error("No image files found in", dir);
    console.error("Allowed:", EXTENSIONS.join(", "));
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Uploading", files.length, "images to bucket", BUCKET, "\n");

  let uploaded = 0;
  let updated = 0;

  for (const filename of files) {
    const slug = path.basename(filename, path.extname(filename));
    const filePath = path.join(dir, filename);

    const buf = fs.readFileSync(filePath);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filename, buf, {
      contentType: getMime(filename),
      upsert: true,
    });

    if (uploadError) {
      console.error("  Upload failed", filename, uploadError.message);
      continue;
    }
    uploaded++;

    const publicUrl = getPublicUrl(filename);
    const { error: updateError } = await supabase
      .from("film_stocks")
      .update({ image_url: publicUrl })
      .eq("slug", slug);

    if (updateError) {
      console.warn("  Uploaded", filename, "but no film_stocks row with slug:", slug);
      continue;
    }
    updated++;
    console.log("  OK", filename, "→ slug", slug);
  }

  console.log("\nDone. Uploaded:", uploaded, "Updated image_url:", updated);
}

function getMime(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const m: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return m[ext] ?? "application/octet-stream";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
