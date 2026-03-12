/**
 * Replace a single film stock image in Supabase Storage and update film_stocks.
 * Reads from public/films-replace/<slug>.<ext> and uploads to the film-stocks bucket,
 * then sets film_stocks.image_url for the matching slug.
 *
 * Usage:
 *   npx tsx scripts/replace-single-film-image.ts [slug]
 *   (default slug: cinestill-800t)
 *
 * Example: npx tsx scripts/replace-single-film-image.ts cinestill-800t
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
const FOLDER = "public/films-replace";
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

function getPublicUrl(filename: string): string {
  if (!url) return "";
  const base = url.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${filename}`;
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

function findFileForSlug(dir: string, slug: string): string | null {
  for (const ext of EXTENSIONS) {
    const filename = `${slug}${ext}`;
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filename;
    }
  }
  return null;
}

async function main() {
  const slug = process.argv[2] ?? "cinestill-800t";
  const dir = path.resolve(process.cwd(), FOLDER);

  if (!url || !serviceRoleKey) {
    console.error("Missing env. In .env.local set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error("Folder not found:", dir);
    process.exit(1);
  }

  const filename = findFileForSlug(dir, slug);
  if (!filename) {
    console.error("No image found for slug:", slug);
    console.error("Looked for", EXTENSIONS.map((e) => `${slug}${e}`).join(", "), "in", dir);
    process.exit(1);
  }

  const filePath = path.join(dir, filename);
  const buf = fs.readFileSync(filePath);

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filename, buf, {
    contentType: getMime(filename),
    upsert: true,
  });

  if (uploadError) {
    console.error("Upload failed:", uploadError.message);
    process.exit(1);
  }
  console.log("Uploaded", filename, "to bucket", BUCKET);

  const publicUrl = getPublicUrl(filename);
  const { data: row, error: updateError } = await supabase
    .from("film_stocks")
    .update({ image_url: publicUrl })
    .eq("slug", slug)
    .select("id, slug, name")
    .single();

  if (updateError || !row) {
    console.error("DB update failed:", updateError?.message ?? "No row matched slug " + slug);
    process.exit(1);
  }

  console.log("Updated film_stocks:", row.slug, row.name ?? "");
  console.log("image_url:", publicUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
