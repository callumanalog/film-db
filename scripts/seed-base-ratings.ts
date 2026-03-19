/**
 * Seed 10 "base" ratings per film stock in Supabase (user_ratings).
 * Uses 10 synthetic seed users; ratings are tiered (high / mid / niche) and look organic.
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 * Usage: npx tsx scripts/seed-base-ratings.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_USER_EMAIL_PREFIX = "seed-rating-";
const SEED_USER_COUNT = 10;
const RATINGS_PER_STOCK = 10;

type Tier = "high" | "mid" | "niche";

/** Target average and allowed values per tier. */
const TIER_CONFIG: Record<
  Tier,
  { minAvg: number; maxAvg: number; allowed: number[] }
> = {
  high: {
    minAvg: 4.5,
    maxAvg: 4.8,
    allowed: [3, 3.5, 4, 4.5, 5],
  },
  mid: {
    minAvg: 3.8,
    maxAvg: 4.3,
    allowed: [3, 3.5, 4, 4.5, 5],
  },
  niche: {
    minAvg: 3.0,
    maxAvg: 3.7,
    allowed: [2, 2.5, 3, 3.5, 4, 4.5],
  },
};

/** High-tier professional stocks (Portra, Ektar, Fuji Pro, etc.). */
const HIGH_TIER_SLUGS = new Set([
  "kodak-portra-400",
  "kodak-portra-160",
  "kodak-portra-800",
  "kodak-ektar-100",
  "fujifilm-pro-400h",
  "fujifilm-velvia-50",
  "fujifilm-provia-100f",
  "fujifilm-acros-ii",
  "kodak-tri-x-400",
  "kodak-tmax-400",
  "kodak-tmax-100",
  "ilford-delta-100",
  "ilford-delta-400",
  "cinestill-800t",
]);

/** Niche/technical/specialty stocks (ADOX, Rollei, Lomography specialty, etc.). */
const NICHE_TIER_SLUGS = new Set([
  "adox-silvermax-100",
  "adox-cms-20-ii",
  "adox-chs-100-ii",
  "adox-hr-50",
  "adox-color-mission-200",
  "rollei-rpx-25",
  "rollei-rpx-100",
  "rollei-rpx-400",
  "rollei-infrared-400",
  "rollei-retro-80s",
  "rollei-retro-400s",
  "rollei-superpan-200",
  "lomography-lomochrome-purple",
  "lomography-lomochrome-metropolis",
  "lomography-fantome-kino-8",
  "lomography-potsdam-kino-100",
  "lomography-earl-grey-100",
  "lomography-berlin-kino-400",
  "lomography-lady-grey-400",
  "fomapan-100-classic",
  "fomapan-200-creative",
  "fomapan-400-action",
  "fomapan-r-100",
  "retropan-320-soft",
  "kentmere-pan-100",
  "kentmere-pan-400",
  "bergger-pancro-400",
  "agfa-apx-100",
  "agfa-apx-400",
  "jch-streetpan-400",
  "washi-a",
  "washi-s",
  "silberra-u100",
  "orwo-wolfen-nc500",
  "orwo-wolfen-np100",
  "harman-phoenix-200",
  "harman-phoenix-ii",
  "harman-red",
  "harman-switch-azure",
  "dubblefilm-sunstroke",
  "dubblefilm-monsoon",
  "revolog-streak",
  "revolog-kolor",
  "revolog-460nm",
  "street-candy-mtn-100",
  "ferrania-p30-alpha",
  "kosmo-foto-mono-100",
]);

function getTier(slug: string): Tier {
  if (HIGH_TIER_SLUGS.has(slug)) return "high";
  if (NICHE_TIER_SLUGS.has(slug)) return "niche";
  return "mid";
}

/** Deterministic pseudo-random from string seed (for reproducible ratings per slug). */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 2 ** 32;
  };
}

/**
 * Generate 10 organic-looking ratings that average within the tier's range.
 * Mix of 5s, 4.5s, 4s, and the occasional 3 so it feels human.
 */
function generateRatings(slug: string, tier: Tier): number[] {
  const config = TIER_CONFIG[tier];
  const rand = seededRandom(slug);
  const allowed = config.allowed;
  const targetAvg =
    config.minAvg + (config.maxAvg - config.minAvg) * (0.3 + rand() * 0.4);

  const ratings: number[] = [];
  for (let i = 0; i < RATINGS_PER_STOCK; i++) {
    const idx = Math.min(Math.floor(rand() * allowed.length), allowed.length - 1);
    ratings.push(allowed[idx]);
  }

  let sum = ratings.reduce((a, b) => a + b, 0);
  let currentAvg = sum / RATINGS_PER_STOCK;
  const step = 0.5;
  let attempts = 0;
  while (Math.abs(targetAvg - currentAvg) > 0.08 && attempts < 40) {
    const idx = Math.floor(rand() * RATINGS_PER_STOCK);
    const current = ratings[idx];
    const toAdjust = targetAvg > currentAvg ? 1 : -1;
    const candidate = Math.max(1, Math.min(5, current + toAdjust * step));
    const candidateRounded = Math.round(candidate * 2) / 2;
    if (candidateRounded !== current && allowed.includes(candidateRounded)) {
      ratings[idx] = candidateRounded;
      sum = sum - current + candidateRounded;
      currentAvg = sum / RATINGS_PER_STOCK;
    }
    attempts++;
  }

  return ratings.map((n) => Math.round(n * 2) / 2);
}

async function getOrCreateSeedUsers(): Promise<string[]> {
  const ids: string[] = [];
  const domain = "filmdb-seed.local";

  for (let i = 1; i <= SEED_USER_COUNT; i++) {
    const email = `${SEED_USER_EMAIL_PREFIX}${i}@${domain}`;
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password: `SeedRating${i}-${Date.now().toString(36)}`,
      email_confirm: true,
    });
    if (error) {
      if (error.message?.toLowerCase().includes("already") || error.message?.toLowerCase().includes("exists")) {
        const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const user = list?.users?.find((u) => u.email === email);
        if (user) {
          ids.push(user.id);
          continue;
        }
      }
      console.error("Failed to create seed user", email, error.message);
      throw error;
    }
    if (created.user) ids.push(created.user.id);
  }

  if (ids.length < SEED_USER_COUNT) {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const seedUsers = (data?.users ?? []).filter((u) =>
      u.email?.startsWith(SEED_USER_EMAIL_PREFIX)
    );
    for (const u of seedUsers) {
      if (u.id && !ids.includes(u.id)) ids.push(u.id);
      if (ids.length >= SEED_USER_COUNT) break;
    }
  }

  if (ids.length !== SEED_USER_COUNT) {
    throw new Error(
      `Expected ${SEED_USER_COUNT} seed users, got ${ids.length}. Ensure Auth allows creating users or create them in the Supabase dashboard.`
    );
  }
  return ids;
}

async function main() {
  console.log("Seed base ratings: fetching film stocks and ensuring seed users...\n");

  const { data: stocks, error: stocksError } = await supabase
    .from("film_stocks")
    .select("slug");
  if (stocksError) {
    console.error("Failed to fetch film_stocks:", stocksError.message);
    process.exit(1);
  }
  const slugs = (stocks ?? []).map((r) => r.slug as string).filter(Boolean);
  console.log("  Film stocks:", slugs.length);

  const userIds = await getOrCreateSeedUsers();
  console.log("  Seed users:", userIds.length);

  let upserted = 0;
  const now = new Date().toISOString();

  for (const slug of slugs) {
    const tier = getTier(slug);
    const ratings = generateRatings(slug, tier);

    for (let i = 0; i < RATINGS_PER_STOCK; i++) {
      const { error } = await supabase.from("user_ratings").upsert(
        {
          user_id: userIds[i],
          film_stock_slug: slug,
          rating: ratings[i],
          updated_at: now,
        },
        { onConflict: "user_id,film_stock_slug" }
      );
      if (error) {
        console.error("  Upsert failed for", slug, "user", i, error.message);
        continue;
      }
      upserted++;
    }
  }

  console.log("\n  Total ratings upserted:", upserted);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
