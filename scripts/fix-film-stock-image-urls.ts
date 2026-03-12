/**
 * Fix film_stocks rows that still have local paths (/films/...) by updating image_url
 * to the Supabase storage public URL. Use after upload-film-stock-images.ts when some
 * rows were missed (e.g. slug didn't match filename).
 *
 * Usage: npx tsx scripts/fix-film-stock-image-urls.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=
 *   SUPABASE_SERVICE_ROLE_KEY=
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BUCKET = "film-stocks";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getPublicUrl(filename: string): string {
  if (!url) return "";
  const base = url.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function main() {
  if (!url || !serviceRoleKey) {
    console.error("Missing env. In .env.local set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rows, error: fetchError } = await supabase
    .from("film_stocks")
    .select("id, slug, image_url")
    .like("image_url", "/films/%");

  if (fetchError) {
    console.error("Failed to fetch film_stocks:", fetchError.message);
    process.exit(1);
  }

  if (!rows?.length) {
    console.log("No rows with local /films/ paths found. All image_urls are already updated.");
    return;
  }

  console.log("Updating", rows.length, "rows with local paths to Supabase URLs...\n");

  let updated = 0;
  for (const row of rows) {
    const path = (row.image_url as string).trim();
    const filename = path.replace(/^\/films\/?/, "");
    if (!filename) continue;
    const publicUrl = getPublicUrl(filename);
    const { error: updateError } = await supabase
      .from("film_stocks")
      .update({ image_url: publicUrl })
      .eq("id", row.id);
    if (updateError) {
      console.error("  Failed", row.slug, updateError.message);
      continue;
    }
    updated++;
    console.log("  OK", row.slug, "→", filename);
  }

  console.log("\nDone. Updated", updated, "of", rows.length, "rows.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
