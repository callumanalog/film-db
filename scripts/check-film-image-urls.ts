import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "film-stocks";

if (!url || !key) {
  console.log("Skipping film image URL check: Supabase env vars are not configured.");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const supabaseUrl = url;

function getPublicPrefix(): string {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/`;
}

async function main() {
  const { data, error } = await supabase.from("film_stocks").select("slug, name, image_url");
  if (error) {
    console.error("Film image URL check failed:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("Skipping film image URL check: Supabase catalog is empty.");
    return;
  }

  const prefix = getPublicPrefix();
  const badRows: { slug: string; image_url: string }[] = [];
  const missingRows: { slug: string; name: string }[] = [];

  for (const row of data) {
    const imageUrl = typeof row.image_url === "string" ? row.image_url.trim() : "";
    if (imageUrl === "") {
      missingRows.push({ slug: row.slug, name: row.name });
      continue;
    }
    if (!imageUrl.startsWith(prefix)) {
      badRows.push({ slug: row.slug, image_url: imageUrl });
    }
  }

  if (badRows.length > 0) {
    console.error("Found non-canonical film_stocks.image_url values:");
    for (const row of badRows) {
      console.error(`- ${row.slug}: ${row.image_url}`);
    }
    process.exit(1);
  }

  console.log(
    `Film image URL check passed: ${data.length - missingRows.length}/${data.length} stocks use canonical ${BUCKET} public URLs.`
  );

  if (missingRows.length > 0) {
    console.log("\nStocks without product images (allowed, renders placeholder):");
    for (const row of missingRows) {
      console.log(`- ${row.slug} (${row.name})`);
    }
  }
}

main().catch((error) => {
  console.error("Film image URL check failed:", error);
  process.exit(1);
});
