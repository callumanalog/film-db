import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import filmStocks from "../data/film-stocks.json";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("Skipping catalog sync check: Supabase env vars are not configured.");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.from("film_stocks").select("slug, name");
  if (error) {
    console.error("Catalog sync check failed:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("Skipping catalog sync check: Supabase catalog is empty.");
    return;
  }

  const supabaseSlugs = new Set(data.map((stock) => stock.slug));
  const onlyLocal = filmStocks
    .filter((stock) => !supabaseSlugs.has(stock.slug))
    .map((stock) => `${stock.slug} (${stock.name})`)
    .sort((a, b) => a.localeCompare(b));

  if (onlyLocal.length > 0) {
    console.error("Local film stocks missing from Supabase:");
    for (const stock of onlyLocal) {
      console.error(`- ${stock}`);
    }
    process.exit(1);
  }

  console.log(`Catalog sync check passed: ${data.length} Supabase stocks cover all ${filmStocks.length} local entries.`);
}

main().catch((error) => {
  console.error("Catalog sync check failed:", error);
  process.exit(1);
});
