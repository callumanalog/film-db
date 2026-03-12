/**
 * Replace film-stock images in Supabase Storage by uploading new files from a folder.
 * Use this when you have new images (e.g. background-removed or reshot) and want to
 * overwrite the placeholders without changing URLs or looking up slugs.
 *
 * Name each file exactly as it appears in the bucket (e.g. adox-chs-100.jpg, portra-400.jpg).
 * The script uploads each file (overwriting the object) and updates any film_stocks row
 * whose image_url points to that filename.
 *
 * Usage: npx tsx scripts/replace-film-stock-images.ts [folder]
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

async function main() {
  const folder = process.argv[2] ?? "public/films";
  const dir = path.resolve(process.cwd(), folder);

  if (!url || !serviceRoleKey) {
    console.error("Missing env. In .env.local set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error("Folder not found:", dir);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => EXTENSIONS.includes(path.extname(f).toLowerCase()));
  if (files.length === 0) {
    console.error("No image files in", dir);
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Replacing", files.length, "images in bucket", BUCKET, "\n");

  let uploaded = 0;
  let updated = 0;

  for (const filename of files) {
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
    // Update any row whose image_url ends with this filename (handles full URL or path)
    const { data: rows, error: selectError } = await supabase
      .from("film_stocks")
      .select("id, slug")
      .like("image_url", `%/${filename}`);

    let rowCount = 0;
    if (!selectError && rows?.length) {
      for (const row of rows) {
        const { error: updateError } = await supabase
          .from("film_stocks")
          .update({ image_url: publicUrl })
          .eq("id", row.id);
        if (!updateError) {
          updated++;
          rowCount++;
        }
      }
    }
    console.log("  OK", filename, rowCount ? `→ ${rowCount} row(s)` : "(no matching row)");
  }

  console.log("\nDone. Uploaded:", uploaded, "DB rows updated:", updated);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
