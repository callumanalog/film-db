/**
 * One-time script to seed your Supabase database from in-app seed data.
 * Run after applying migrations 001 and 002 in the Supabase SQL Editor.
 *
 * Usage: npx tsx scripts/seed-supabase.ts
 * (Loads .env.local automatically; ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.)
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { seedBrands, seedFilmStocks, seedPurchaseLinks } from "../src/lib/seed-data";
import { normalizeFilmStockFromFile } from "../src/lib/editable-film-stocks";

// Prefer .env.local so we use the same credentials as the app
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in .env.local.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log("Seeding Supabase...\n");

  // 1. Insert brands and build slug -> id map
  const brandSlugToId = new Map<string, string>();
  for (const b of seedBrands) {
    const { data, error } = await supabase
      .from("film_brands")
      .insert({
        name: b.name,
        slug: b.slug,
        logo_url: b.logo_url,
        description: b.description,
        website_url: b.website_url,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        const { data: existing } = await supabase.from("film_brands").select("id").eq("slug", b.slug).single();
        if (existing) {
          brandSlugToId.set(b.slug, existing.id);
          console.log("  Brand already exists:", b.slug);
          continue;
        }
      }
      console.error("Error inserting brand", b.slug, error);
      throw error;
    }
    if (data) brandSlugToId.set(b.slug, data.id);
  }
  console.log("  Brands:", brandSlugToId.size);

  // 2. Map seed brand_id to slug (seed uses id like "brand-kodak")
  const seedBrandIdToSlug = new Map(seedBrands.map((b) => [b.id, b.slug]));

  // 3. Insert film stocks and build slug -> id map (normalize seed to new schema: scales 1–5, shooting_notes)
  const stockSlugToId = new Map<string, string>();
  for (const raw of seedFilmStocks) {
    const s = normalizeFilmStockFromFile(raw as unknown as Record<string, unknown>);
    const brandSlug = seedBrandIdToSlug.get(s.brand_id);
    if (!brandSlug) {
      console.warn("  Skipping stock (unknown brand):", s.slug);
      continue;
    }
    const brandId = brandSlugToId.get(brandSlug);
    if (!brandId) {
      console.warn("  Skipping stock (no brand id):", s.slug);
      continue;
    }
    const { data, error } = await supabase
      .from("film_stocks")
      .insert({
        name: s.name,
        slug: s.slug,
        brand_id: brandId,
        format: s.format,
        type: s.type,
        iso: s.iso,
        description: s.description,
        history: s.history,
        shooting_notes: s.shooting_notes?.length ? s.shooting_notes : null,
        grain: s.grain,
        contrast: s.contrast,
        latitude: s.latitude,
        saturation: s.saturation,
        color_balance: s.color_balance,
        discontinued: s.discontinued,
        image_url: s.image_url,
        featured: s.featured,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        const { data: existing } = await supabase.from("film_stocks").select("id").eq("slug", s.slug).single();
        if (existing) {
          stockSlugToId.set(s.slug, existing.id);
          console.log("  Stock already exists:", s.slug);
          continue;
        }
      }
      console.error("Error inserting stock", s.slug, error);
      throw error;
    }
    if (data) stockSlugToId.set(s.slug, data.id);
  }
  console.log("  Film stocks:", stockSlugToId.size);

  // 4. Map seed film_stock_id to slug (seed uses id like "stock-portra-400")
  const seedStockIdToSlug = new Map(seedFilmStocks.map((s) => [s.id, s.slug]));

  // 5. Insert purchase links
  let linksInserted = 0;
  for (const pl of seedPurchaseLinks) {
    const stockSlug = seedStockIdToSlug.get(pl.film_stock_id);
    if (!stockSlug) continue;
    const filmStockId = stockSlugToId.get(stockSlug);
    if (!filmStockId) continue;
    const { error } = await supabase.from("film_stock_purchase_links").insert({
      film_stock_id: filmStockId,
      retailer_name: pl.retailer_name,
      url: pl.url,
      price_note: pl.price_note,
    });
    if (error) {
      console.warn("  Purchase link insert warning:", pl.retailer_name, error.message);
      continue;
    }
    linksInserted++;
  }
  console.log("  Purchase links:", linksInserted);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
